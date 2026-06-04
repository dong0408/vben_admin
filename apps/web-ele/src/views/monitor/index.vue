<script lang="ts" setup>
import type { ClusterGroup } from './cluster';
import type { VehicleData } from './mock';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { useFullscreen, useThrottleFn } from '@vueuse/core';
import { ElCascader, ElMessageBox } from 'element-plus';
import * as maptalks from 'maptalks';

import alertSoundUrl from '#/assets/audio/alert.wav';

import { chinaRegions, findRegionByPath } from './china-regions';
import { buildClusters } from './cluster';
import { generateMockVehicles } from './mock';

import 'maptalks/dist/maptalks.css';

defineOptions({ name: 'MonitorScreenModule' });

const { toggle: toggleScreen } = useFullscreen();
// 获取外部挂载的 DOM 容器引用
const mapContainer = ref<HTMLElement | null>(null);

// 核心实例：地图、单车图层、聚合气泡图层
let map: maptalks.Map | null = null;
let vehicleLayer: maptalks.VectorLayer | null = null;
let clusterLayer: maptalks.VectorLayer | null = null;

// 聚合网格单元边长（容器像素）：越大聚合越激进
const CLUSTER_CELL_PX = 64;
// 单车标记池上限：超过后回收视野外的标记，避免长时间漫游导致字典无限膨胀
const MARKER_POOL_LIMIT = 1200;

// 车辆 id → 单车 Marker（canvas 渲染，懒创建；不在本轮聚合结果内时 hide）
// 【优化点】切忌每次刷新数据都销毁重建图层，这里持有字典做最小增量更新。
const markerDict = new Map<string, maptalks.Marker>();
// 聚合 key → 簇 Marker
const clusterDict = new Map<string, maptalks.Marker>();
// 本轮以「单车」形式显示的车辆 id，用于增量 diff
let visibleSingleIds = new Set<string>();

// 报警车辆周边的扩散光圈 UIMarker 字典
const alertRippleDict = new Map<string, maptalks.ui.UIMarker>();
// 当前处于报警状态的车辆 ID 集合，用于轮询时计算「新增报警」
const alertedVehicleIds = new Set<string>();

// 悬浮/固定卡片：全屏同时最多一张 DOM 卡片，这是大数据量下不卡顿的关键。
let activeCard: maptalks.ui.UIMarker | null = null;
let hoverCardId: null | string = null; // 鼠标悬浮的车辆 id
let pinnedCardId: null | string = null; // 点击固定的车辆 id

// 声光报警相关
const alertAudio = new Audio(alertSoundUrl);
alertAudio.preload = 'auto';
alertAudio.volume = 0.85;
const audioEnabled = ref(false);

// 本地数据缓存（可成百上千条）与 id 索引
const vehicles = ref<VehicleData[]>([]);
// 以 id 建索引，卡片刷新 / 光圈定位时 O(1) 取车
const vehicleById = new Map<string, VehicleData>();
let simulationTimer: ReturnType<typeof setInterval>;

// 设备状态统计：单次扫描并缓存，避免模板里对全量数组多次 filter
const statusCounts = computed(() => {
  let running = 0;
  let stopped = 0;
  let offline = 0;
  for (const v of vehicles.value) {
    if (v.status === 'running') running += 1;
    else if (v.status === 'stopped') stopped += 1;
    else offline += 1;
  }
  return { offline, running, stopped };
});

// 省市区搜索相关
const selectedRegion = ref<string[]>([]);

const cascaderProps = {
  checkStrictly: true,
  value: 'value',
  label: 'label',
  children: 'children',
};

/**
 * 省市区选择变更后，飞行到对应区域
 */
function handleRegionChange(value: string[]) {
  if (!map || !value || value.length === 0) return;

  const region = findRegionByPath(value);
  if (!region) return;

  map.animateTo(
    {
      center: [region.lng, region.lat],
      zoom: region.zoom,
      pitch: region.zoom >= 12 ? 45 : 30,
    },
    { duration: 800 },
  );
}

const router = useRouter();

const handleNavToDetail = (e: any) => {
  if (e.detail) {
    router.push({ path: '/monitor/detail', query: { id: e.detail } });
  }
};

/**
 * 节流后的统一渲染入口。
 * 地图平移/缩放结束、以及每次轮询数据更新后都通过它触发，
 * 120ms 节流把同一时间窗内的多次触发合并为一次重绘。
 */
const throttledRender = useThrottleFn(renderScene, 120, true);

/**
 * 钩子：页面挂载时初始化
 */
onMounted(() => {
  toggleScreen();
  window.addEventListener('nav-to-detail', handleNavToDetail);

  /**
   * 监控大屏一进入就询问用户是否允许声音告警。
   * 浏览器自动播放策略要求声音必须由用户手势触发，借这次点击解锁 audio 上下文。
   */
  ElMessageBox.confirm(
    '为了在车辆发生报警时第一时间提醒您，需要您授权播放报警声音。',
    '启用声光报警',
    {
      confirmButtonText: '启用',
      cancelButtonText: '稍后',
      type: 'warning',
      closeOnClickModal: false,
      closeOnPressEscape: false,
    },
  )
    .then(() => unlockAudioContext())
    .catch(() => {
      // 用户拒绝则只保留视觉光圈
      audioEnabled.value = false;
    });

  if (!mapContainer.value) return;

  /**
   * 第一部分：延迟初始化 Maptalks 底图
   * 必须添加延迟以对抗 Vue Router 进入转场动画时 mapContainer 宽高为 0 的塌陷 bug
   */
  setTimeout(() => {
    map = new maptalks.Map(mapContainer.value!, {
      center: [121.4737, 31.2304],
      zoom: 13,
      pitch: 45, // 给定 45 度倾斜角，符合大屏指挥中心的 2.5D 倾斜视角风格
      // 底图图层 (BaseLayer)，推荐使用深色地图切片以匹配监控大屏设计
      baseLayer: new maptalks.TileLayer('base', {
        // urlTemplate 代表加载 CartoDB Dark Matter 的开源深色瓦片
        urlTemplate:
          'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['1', '2', '3', '4'], // 高德瓦片子域名
        attribution: '&copy; 高德地图',
      }),
    });

    /**
     * 第二部分：创建图层
     * - vehicleLayer：单车图标（启用高度，让车辆在 3D 视角下立起）
     * - clusterLayer：聚合气泡（绘制在单车之上）
     */
    vehicleLayer = new maptalks.VectorLayer('vehicles', {
      enableAltitude: true,
      altitudeProperty: 'altitude',
    }).addTo(map);
    clusterLayer = new maptalks.VectorLayer('clusters').addTo(map);

    // 1. 生成大批量车辆数据并建立索引（演示：1000 辆）
    vehicles.value = generateMockVehicles(1000);
    rebuildIndex();

    // 2. 首次渲染（聚合 + 视野裁剪）
    renderScene();

    /**
     * 第三部分：地图平移/缩放结束后重新聚合（节流），
     * 以及开启实时刷新器，模拟后端 WebSocket / 长轮询推送
     */
    map.on('zoomend moveend', throttledRender);
    simulationTimer = setInterval(simulateMovement, 2000); // 两秒刷新一次轨迹
  }, 300);
});

/**
 * 钩子：组件卸载前做内存清理
 * 防止大屏应用发生内存泄漏
 */
onUnmounted(() => {
  window.removeEventListener('nav-to-detail', handleNavToDetail);
  if (simulationTimer) clearInterval(simulationTimer);
  if (map) map.off('zoomend moveend', throttledRender);

  // 清理报警光圈
  alertRippleDict.forEach((ripple) => ripple.remove());
  alertRippleDict.clear();
  alertedVehicleIds.clear();

  // 清理聚合气泡与标记字典
  clusterDict.forEach((marker) => marker.remove());
  clusterDict.clear();
  markerDict.clear();
  visibleSingleIds.clear();

  // 释放悬浮卡片
  activeCard?.remove();
  activeCard = null;

  // 暂停并释放音频
  alertAudio.pause();
  alertAudio.src = '';

  if (map) {
    map.remove();
    map = null;
  }
});

/** 重建 id → 车辆 的索引 */
function rebuildIndex() {
  vehicleById.clear();
  for (const v of vehicles.value) vehicleById.set(v.id, v);
}

/**
 * 借助用户的「启用」点击手势解锁浏览器音频上下文。
 * 用静音播放绕过浏览器策略，之后程序触发的 play() 即可正常发声。
 */
async function unlockAudioContext() {
  try {
    alertAudio.muted = true;
    await alertAudio.play();
    alertAudio.pause();
    alertAudio.currentTime = 0;
    alertAudio.muted = false;
    audioEnabled.value = true;
  } catch {
    audioEnabled.value = false;
  }
}

/**
 * 启动报警提示音（循环播放）。
 * 已在响则不重启 currentTime，避免连续报警里声音被反复打断。
 */
function startAlertSound() {
  if (!audioEnabled.value) return;
  if (!alertAudio.paused) return;
  try {
    alertAudio.loop = true;
    alertAudio.currentTime = 0;
    void alertAudio.play().catch(() => {
      audioEnabled.value = false;
    });
  } catch {
    // 静默忽略
  }
}

/**
 * 停止报警提示音，并复位播放进度。所有报警解除时调用。
 */
function stopAlertSound() {
  try {
    alertAudio.pause();
    alertAudio.currentTime = 0;
  } catch {
    // 静默忽略
  }
}

/**
 * 为指定车辆添加扩散光圈 UIMarker。
 * 用三道带不同 delay 的 CSS 关键帧动画营造雷达扫描般的扩散效果。
 */
function addAlertRipple(v: VehicleData) {
  if (!map || alertRippleDict.has(v.id)) return;
  const html = `
    <div class="alert-ripple-container">
      <span class="alert-ripple"></span>
      <span class="alert-ripple" style="animation-delay: 0.7s;"></span>
      <span class="alert-ripple" style="animation-delay: 1.4s;"></span>
    </div>
  `;
  const ripple = new maptalks.ui.UIMarker([v.lng, v.lat], {
    content: html,
    dy: -10,
    dx: 0,
  });
  ripple.addTo(map);
  alertRippleDict.set(v.id, ripple);
}

function removeAlertRipple(id: string) {
  const ripple = alertRippleDict.get(id);
  if (ripple) {
    ripple.remove();
    alertRippleDict.delete(id);
  }
}

function updateAlertRipplePosition(v: VehicleData) {
  alertRippleDict.get(v.id)?.setCoordinates([v.lng, v.lat]);
}

/**
 * 仅声音：对比上一轮报警车辆集合，识别「新增报警」与「全部解除」，
 * 在首次出现时启动循环声、全部解除时停止声音。
 * 报警光圈的显隐改由 syncAlertRipples 在渲染阶段按可见性统一处理。
 */
function processAlerts() {
  const current = new Set<string>();
  let hasNewAlert = false;

  for (const v of vehicles.value) {
    if (!v.isAlert) continue;
    current.add(v.id);
    if (!alertedVehicleIds.has(v.id)) hasNewAlert = true;
  }

  const hadAlerts = alertedVehicleIds.size > 0;
  alertedVehicleIds.clear();
  current.forEach((id) => alertedVehicleIds.add(id));

  if (hasNewAlert) startAlertSound();
  // 上一轮还有报警、这一轮全部解除 → 关掉声音
  if (hadAlerts && current.size === 0) stopAlertSound();
}

/**
 * 报警光圈：只为「当前以单车显示且处于报警」的车辆维护光圈。
 * 被聚合吞掉或落在视野外的报警车不画光圈（其报警会让所在气泡变红）。
 */
function syncAlertRipples() {
  const want = new Set<string>();
  for (const id of visibleSingleIds) {
    if (vehicleById.get(id)?.isAlert) want.add(id);
  }
  // 移除不再需要的光圈
  for (const id of alertRippleDict.keys()) {
    if (!want.has(id)) removeAlertRipple(id);
  }
  // 新增或更新位置
  for (const id of want) {
    const v = vehicleById.get(id)!;
    if (alertRippleDict.has(id)) updateAlertRipplePosition(v);
    else addAlertRipple(v);
  }
}

/**
 * 按照车辆状态返回不同的颜色主调
 */
const getVehicleColor = (status: VehicleData['status']) => {
  switch (status) {
    case 'offline': {
      return '#6b7280';
    } // 灰色代表离线/失联
    case 'running': {
      return '#10b981';
    } // 翠绿色代表行驶正常
    case 'stopped': {
      return '#f59e0b';
    } // 琥珀橙代表停止
    default: {
      return '#10b981';
    }
  }
};

const generateVehicleSymbol = (v: VehicleData) => {
  const color = getVehicleColor(v.status);
  return [
    {
      // 车辆 SVG 图标（Material UI 经典车标）
      markerType: 'path',
      markerPath:
        'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 16A1.5 1.5 0 1 1 7.5 13a1.5 1.5 0 0 1 0 3zm9 0A1.5 1.5 0 1 1 16.5 13a1.5 1.5 0 0 1 0 3z',
      markerPathWidth: 24,
      markerPathHeight: 24,
      markerWidth: 32,
      markerHeight: 32,
      markerFill: color,
      markerLineColor: '#ffffff',
      markerLineWidth: 1,
      markerDx: 0,
      markerDy: -16, // 把图标锚点拉高以站立在地图坐标上
    },
  ];
};

/** 生成悬浮卡片的 HTML（沿用原大屏霓虹深色风格） */
function buildCardHtml(v: VehicleData): string {
  return `
    <div onclick="window.dispatchEvent(new CustomEvent('nav-to-detail', {detail: '${v.id}'}))" class="cursor-pointer hover:-translate-y-1 transition-transform relative bg-blue-950/80 border border-blue-400/50 backdrop-blur-md rounded shadow-[0_0_15px_rgba(59,130,246,0.3)] w-[160px] pointer-events-auto mt-[-20px]">
      <div class="flex items-center gap-1.5 px-2 py-1.5 border-b border-blue-400/30 bg-blue-500/10">
        <!-- health icon -->
        <span class="w-1.5 h-1.5 rounded-full ${v.health === 'healthy' ? 'bg-emerald-400 shadow-[0_0_5px_#34d399]' : 'bg-red-400 shadow-[0_0_5px_#f87171]'}"></span>
        <!-- status circle icon -->
        <svg class="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_2px_#22d3ee]" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>
        <span class="text-cyan-100 text-xs font-semibold tracking-wider">车辆ID:${v.id}</span>
      </div>
      <div class="p-2 pt-1.5">
        <div class="flex justify-between items-center mb-1.5">
           <span class="text-cyan-300 text-[10px]">任务进度:</span>
           <span class="text-cyan-300 text-[10px] font-mono font-bold">${v.taskProgress}%</span>
        </div>
        <div class="w-full bg-blue-900/80 h-1.5 rounded-full overflow-hidden border border-blue-500/30">
          <div class="bg-cyan-400 h-full shadow-[0_0_8px_#22d3ee] transition-all duration-300" style="width: ${v.taskProgress}%"></div>
        </div>
      </div>
      <!-- 装饰射线模拟连接车辆 -->
      <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-gradient-to-t from-transparent to-cyan-400/70"></div>
    </div>
  `;
}

/** 显示/移动悬浮卡片到指定车辆（全屏仅一张卡片，复用同一个 UIMarker） */
function showCard(id: string) {
  if (!map) return;
  const v = vehicleById.get(id);
  if (!v) {
    hideCard();
    return;
  }
  const html = buildCardHtml(v);
  if (activeCard) {
    activeCard.setContent(html);
    activeCard.setCoordinates([v.lng, v.lat]);
    activeCard.show();
  } else {
    activeCard = new maptalks.ui.UIMarker([v.lng, v.lat], {
      content: html,
      dy: -32,
      dx: 0,
      eventsPropagation: false,
    });
    activeCard.addTo(map);
  }
}

function hideCard() {
  activeCard?.hide();
}

/**
 * 卡片目标 = 固定优先于悬浮。
 * 若目标车辆已被聚合 / 移出视野（不再是可见单车），解除选中并隐藏卡片。
 */
function updateCard() {
  const targetId = pinnedCardId ?? hoverCardId;
  if (targetId && visibleSingleIds.has(targetId) && vehicleById.has(targetId)) {
    showCard(targetId);
    return;
  }
  if (targetId && !visibleSingleIds.has(targetId)) {
    if (pinnedCardId === targetId) pinnedCardId = null;
    if (hoverCardId === targetId) hoverCardId = null;
  }
  hideCard();
}

/** 创建单车标记并绑定 hover / click 交互 */
function createVehicleMarker(v: VehicleData): maptalks.Marker {
  const marker = new maptalks.Marker([v.lng, v.lat], {
    id: v.id,
    symbol: generateVehicleSymbol(v),
    properties: { vid: v.id },
  });
  marker.on('mouseenter', () => {
    hoverCardId = v.id;
    map?.setCursor('pointer');
    updateCard();
  });
  marker.on('mouseout', () => {
    if (hoverCardId === v.id) hoverCardId = null;
    map?.setCursor('default');
    updateCard();
  });
  marker.on('click', () => {
    // 再次点击同一辆取消固定
    pinnedCardId = pinnedCardId === v.id ? null : v.id;
    updateCard();
  });
  return marker;
}

/** 聚合气泡 symbol：按数量分级配色与尺寸，含报警转红 */
function clusterSymbol(c: ClusterGroup) {
  const base = c.count < 10 ? 36 : c.count < 50 ? 46 : c.count < 200 ? 56 : 66;
  const fill = c.hasAlert
    ? '#ef4444'
    : c.count < 10
      ? '#3b82f6'
      : c.count < 50
        ? '#0ea5e9'
        : c.count < 200
          ? '#06b6d4'
          : '#f59e0b';
  const halo = c.hasAlert
    ? 'rgba(239, 68, 68, 0.25)'
    : 'rgba(6, 182, 212, 0.22)';
  return [
    {
      // 外层光晕
      markerType: 'ellipse',
      markerWidth: base + 16,
      markerHeight: base + 16,
      markerFill: halo,
      markerLineWidth: 0,
    },
    {
      // 内层实心 + 数量文字
      markerType: 'ellipse',
      markerWidth: base,
      markerHeight: base,
      markerFill: fill,
      markerFillOpacity: 0.9,
      markerLineColor: '#ffffff',
      markerLineWidth: 2,
      textName: String(c.count),
      textFill: '#ffffff',
      textSize: c.count < 100 ? 14 : 12,
      textWeight: 'bold',
      textHorizontalAlignment: 'middle',
      textVerticalAlignment: 'middle',
      textDy: 0,
    },
  ];
}

/** 创建聚合气泡并绑定「点击放大拆分」交互 */
function createClusterMarker(c: ClusterGroup): maptalks.Marker {
  const marker = new maptalks.Marker([c.lng, c.lat], {
    symbol: clusterSymbol(c),
    properties: { cluster: true },
  });
  marker.on('click', () => {
    if (!map) return;
    // 读实时质心，避免闭包里用到旧的 c
    const coord = marker.getCoordinates();
    map.animateTo(
      {
        center: [coord.x, coord.y],
        zoom: Math.min(map.getMaxZoom(), map.getZoom() + 2),
      },
      { duration: 500 },
    );
  });
  marker.on('mouseenter', () => map?.setCursor('pointer'));
  marker.on('mouseout', () => map?.setCursor('default'));
  return marker;
}

/**
 * 统一渲染：聚合 + 视野裁剪 + 增量 diff。
 * 复用 markerDict / clusterDict，只对「本轮该显示的子集」做最小改动。
 */
function renderScene() {
  if (!map || !vehicleLayer || !clusterLayer) return;

  const { singles, clusters } = buildClusters(
    map,
    vehicles.value,
    CLUSTER_CELL_PX,
  );

  // ---- 单车增量 diff ----
  const nextSingleIds = new Set<string>();
  for (const v of singles) nextSingleIds.add(v.id);

  // 上一轮显示、本轮不再是单车的 → 隐藏
  for (const id of visibleSingleIds) {
    if (!nextSingleIds.has(id)) markerDict.get(id)?.hide();
  }

  // 本轮单车 → 创建或更新坐标 / 符号
  for (const v of singles) {
    let marker = markerDict.get(v.id);
    if (marker) {
      marker.setCoordinates([v.lng, v.lat]);
      marker.setSymbol(generateVehicleSymbol(v));
      if (!marker.isVisible()) marker.show();
    } else {
      marker = createVehicleMarker(v);
      vehicleLayer.addGeometry(marker);
      markerDict.set(v.id, marker);
    }
  }
  visibleSingleIds = nextSingleIds;

  // ---- 聚合气泡增量 diff ----
  const nextClusterKeys = new Set<string>();
  for (const c of clusters) nextClusterKeys.add(c.key);

  for (const [key, marker] of clusterDict) {
    if (!nextClusterKeys.has(key)) {
      marker.remove();
      clusterDict.delete(key);
    }
  }
  for (const c of clusters) {
    const marker = clusterDict.get(c.key);
    if (marker) {
      marker.setCoordinates([c.lng, c.lat]);
      marker.setSymbol(clusterSymbol(c));
    } else {
      const created = createClusterMarker(c);
      clusterLayer.addGeometry(created);
      clusterDict.set(c.key, created);
    }
  }

  // ---- 卡片 / 报警光圈 ----
  updateCard();
  syncAlertRipples();

  // ---- 标记池回收，防止长时间漫游后膨胀 ----
  evictFarMarkers();
}

/** 当标记池超限时，移除落在视野外（且非当前单车）的标记 */
function evictFarMarkers() {
  if (!map || markerDict.size <= MARKER_POOL_LIMIT) return;
  const ext = map.getExtent();
  if (!ext) return;
  const mx = (ext.xmax - ext.xmin) * 0.5;
  const my = (ext.ymax - ext.ymin) * 0.5;
  for (const [id, marker] of markerDict) {
    if (visibleSingleIds.has(id)) continue;
    const v = vehicleById.get(id);
    if (
      !v ||
      v.lng < ext.xmin - mx ||
      v.lng > ext.xmax + mx ||
      v.lat < ext.ymin - my ||
      v.lat > ext.ymax + my
    ) {
      marker.remove();
      markerDict.delete(id);
    }
  }
}

/**
 * 模拟小车的运动轨迹和状态：只更新数据 + 处理声音，
 * 渲染统一交给 throttledRender（与地图平移/缩放合并节流）。
 */
function simulateMovement() {
  vehicles.value = vehicles.value.map((v) => {
    // 只有运行状态的车辆才发生经纬度变化
    if (v.status !== 'running') return v;

    const newLng = v.lng + (Math.random() - 0.5) * 0.005;
    const newLat = v.lat + (Math.random() - 0.5) * 0.005;
    const newSpeed = Math.floor(Math.random() * 20) + 40;
    const newTaskProgress =
      v.taskProgress >= 100
        ? 0
        : Math.min(100, v.taskProgress + Math.floor(Math.random() * 5));

    // 报警：已报警 ~12% 概率解除；未报警按低概率新增（大数据量下调低，避免同时报警过多）
    let nextIsAlert = v.isAlert;
    let nextAlertMessage = v.alertMessage;
    if (v.isAlert) {
      if (Math.random() < 0.12) {
        nextIsAlert = false;
        nextAlertMessage = undefined;
      }
    } else if (Math.random() < 0.0005) {
      nextIsAlert = true;
      nextAlertMessage = '发动机温度异常';
    }

    return {
      ...v,
      lng: newLng,
      lat: newLat,
      speed: newSpeed,
      taskProgress: newTaskProgress,
      isAlert: nextIsAlert,
      alertMessage: nextAlertMessage,
    };
  });

  // 重建索引 → 处理声音 → 触发节流渲染
  rebuildIndex();
  processAlerts();
  throttledRender();
}
</script>

<template>
  <!-- <Page> 是 vben 原生自适应外盒，设置自动填充高度，不要 padding (!p-0) 以求充满整个容器边界 -->
  <Page auto-content-height class="relative h-full w-full overflow-hidden !p-0">
    <!-- 渲染挂载点：maptalks 在这里生成 canvas 图层 -->
    <div ref="mapContainer" class="size-full min-h-[500px]"></div>

    <!-- 大屏的纯前端玻璃拟物态数据面板区，放置在图册顶部，设定 z-index 为 10 -->
    <div class="pointer-events-none absolute left-6 top-4 z-10 mb-4 w-full">
      <!-- 主标题，使用 drop-shadow 大幅增强暗黑屏下的霓虹感 -->
      <div class="mt-4 flex gap-4">
        <button
          @click="toggleScreen"
          class="bg-dark-900/70 pointer-events-auto flex items-center gap-2 rounded-lg border border-blue-500/30 px-3 py-1.5 text-blue-400 shadow-lg backdrop-blur-md transition-all hover:border-blue-500/60 hover:bg-blue-900/20"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <span class="text-sm font-semibold tracking-wider">全屏切换</span>
        </button>
      </div>
    </div>

    <!-- 右侧悬浮控制面板 (Glassmorphism) -->
    <div
      class="pointer-events-none absolute bottom-4 right-6 top-4 z-10 flex w-[360px] flex-col gap-4"
    >
      <!-- 搜索面板 -->
      <div
        class="bg-dark-900/70 pointer-events-auto shrink-0 rounded-xl border border-blue-500/30 p-4 shadow-lg backdrop-blur-md transition-transform hover:border-blue-500/60"
      >
        <div class="mb-3 flex items-center gap-2">
          <svg
            class="h-4 w-4 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="text-sm font-semibold tracking-wider text-gray-200"
            >区域定位</span
          >
        </div>
        <ElCascader
          v-model="selectedRegion"
          :options="chinaRegions"
          :props="cascaderProps"
          clearable
          filterable
          placeholder="搜索省/市/区"
          class="w-full"
          @change="handleRegionChange"
        />
      </div>

      <!-- 面板主体 (可滚动) -->
      <div
        class="bg-dark-900/70 custom-scrollbar pointer-events-auto flex flex-1 flex-col gap-6 overflow-y-auto rounded-xl border border-blue-500/30 p-4 shadow-lg backdrop-blur-md"
      >
        <!-- 设备状态列表 -->
        <section>
          <div class="mb-3 flex items-center gap-2">
            <svg
              class="h-4 w-4 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            <h2 class="text-sm font-semibold tracking-wider text-gray-200">
              设备状态 Device Status
            </h2>
          </div>
          <div class="flex flex-col gap-2">
            <div
              class="flex items-center justify-between rounded border border-white/5 bg-white/5 p-2 px-3"
            >
              <div class="flex items-center gap-2">
                <span
                  class="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
                ></span>
                <span class="text-sm text-gray-300">行驶中 Running</span>
              </div>
              <span class="font-mono font-bold text-emerald-400">{{
                statusCounts.running
              }}</span>
            </div>
            <div
              class="flex items-center justify-between rounded border border-white/5 bg-white/5 p-2 px-3"
            >
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-amber-400"></span>
                <span class="text-sm text-gray-300">停止 Stopped</span>
              </div>
              <span class="font-mono font-bold text-amber-400">{{
                statusCounts.stopped
              }}</span>
            </div>
            <div
              class="flex items-center justify-between rounded border border-white/5 bg-white/5 p-2 px-3"
            >
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 rounded-full bg-gray-500"></span>
                <span class="text-sm text-gray-300">离线 Offline</span>
              </div>
              <span class="font-mono font-bold text-gray-400">{{
                statusCounts.offline
              }}</span>
            </div>
          </div>
        </section>

        <!-- 报警信息 -->
        <section>
          <div class="mb-3 flex items-center gap-2">
            <svg
              class="h-4 w-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 class="text-sm font-semibold tracking-wider text-gray-200">
              报警信息 Alarms
            </h2>
          </div>
          <div class="flex flex-col gap-3">
            <div
              class="flex cursor-pointer items-start gap-3 rounded border border-red-500/20 bg-red-500/10 p-2.5 transition-colors hover:bg-red-500/20"
            >
              <svg
                class="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-red-400"
                  >发动机异常高温</span
                >
                <span class="mt-1 text-xs text-gray-400"
                  >云A·88888 | 14:32:01</span
                >
              </div>
            </div>
            <div
              class="flex cursor-pointer items-start gap-3 rounded border border-amber-500/20 bg-amber-500/10 p-2.5 transition-colors hover:bg-amber-500/20"
            >
              <svg
                class="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-amber-400"
                  >严重偏离规划路线</span
                >
                <span class="mt-1 text-xs text-gray-400"
                  >云A·66666 | 13:10:45</span
                >
              </div>
            </div>
            <div
              class="flex cursor-pointer items-start gap-3 rounded border border-blue-500/20 bg-blue-500/10 p-2.5 transition-colors hover:bg-blue-500/20"
            >
              <svg
                class="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-blue-400"
                  >例行保养提醒</span
                >
                <span class="mt-1 text-xs text-gray-400"
                  >云A·12345 | 10:00:00</span
                >
              </div>
            </div>
          </div>
        </section>

        <!-- 视频监控 -->
        <section class="mb-2">
          <div class="mb-3 flex items-center gap-2">
            <svg
              class="h-4 w-4 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <h2 class="text-sm font-semibold tracking-wider text-gray-200">
              视频监控 Surveillance
            </h2>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <!-- 摄像头1 -->
            <div
              class="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded border border-white/5 bg-black/40 backdrop-blur-sm"
            >
              <div
                class="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity group-hover:opacity-100"
              ></div>
              <svg
                class="z-10 h-6 w-6 text-gray-500 transition-colors group-hover:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span
                class="z-10 mt-2 font-mono text-xs text-gray-500 transition-colors group-hover:text-blue-400"
                >CAM 01</span
              >
              <div
                class="absolute left-1.5 top-1.5 z-10 flex items-center gap-1"
              >
                <span
                  class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500"
                ></span>
                <span
                  class="origin-left scale-90 text-[10px] leading-none text-gray-400"
                  >REC</span
                >
              </div>
            </div>
            <!-- 摄像头2 -->
            <div
              class="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded border border-white/5 bg-black/40 backdrop-blur-sm"
            >
              <div
                class="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity group-hover:opacity-100"
              ></div>
              <svg
                class="z-10 h-6 w-6 text-gray-500 transition-colors group-hover:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span
                class="z-10 mt-2 font-mono text-xs text-gray-500 transition-colors group-hover:text-blue-400"
                >CAM 02</span
              >
            </div>
            <!-- 摄像头3 -->
            <div
              class="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded border border-white/5 bg-black/40 backdrop-blur-sm"
            >
              <div
                class="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity group-hover:opacity-100"
              ></div>
              <svg
                class="z-10 h-6 w-6 text-gray-500 transition-colors group-hover:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span
                class="z-10 mt-2 font-mono text-xs text-gray-500 transition-colors group-hover:text-blue-400"
                >CAM 03</span
              >
            </div>
            <!-- 摄像头4 -->
            <div
              class="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded border border-white/5 bg-black/40 backdrop-blur-sm"
            >
              <div
                class="absolute inset-0 bg-blue-500/10 opacity-0 transition-opacity group-hover:opacity-100"
              ></div>
              <svg
                class="z-10 h-6 w-6 text-gray-500 transition-colors group-hover:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span
                class="z-10 mt-2 font-mono text-xs text-gray-500 transition-colors group-hover:text-blue-400"
                >CAM 04</span
              >
            </div>
          </div>
        </section>
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* 利用原生 CSS 为仪表盘增加拟真悬浮感与投影效果 */
.shadow-lg {
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.5),
    0 4px 6px -2px rgba(0, 0, 0, 0.25);
}

/* 自定义滚动条风格 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.3);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.6);
}
</style>

<!-- 报警光圈动画使用全局样式，确保 maptalks UIMarker 注入的 DOM 也能命中 -->
<style>
.alert-ripple-container {
  position: relative;
  width: 0;
  height: 0;
  pointer-events: none;
}

.alert-ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 36px;
  height: 36px;
  margin-top: -18px;
  margin-left: -18px;
  border-radius: 50%;
  border: 2px solid rgba(239, 68, 68, 0.85);
  box-shadow: 0 0 12px rgba(239, 68, 68, 0.5);
  opacity: 0;
  transform: scale(0.4);
  animation: alert-ripple-expand 2.1s linear infinite;
}

@keyframes alert-ripple-expand {
  0% {
    transform: scale(0.4);
    opacity: 0.9;
  }
  100% {
    transform: scale(5);
    opacity: 0;
  }
}
</style>
