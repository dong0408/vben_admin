<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { ElButton, ElCascader, ElEmpty } from 'element-plus';
import * as maptalks from 'maptalks';

import { chinaRegions, findRegionByPath } from '../../monitor/china-regions';

import 'maptalks/dist/maptalks.css';

defineOptions({ name: 'RouteMapPicker' });

const props = withDefaults(
  defineProps<{
    modelValue?: RoutePoint[];
    readonly?: boolean;
  }>(),
  {
    modelValue: () => [],
    readonly: false,
  },
);

const emits = defineEmits<{
  (e: 'update:modelValue', value: RoutePoint[]): void;
}>();

interface RoutePoint {
  lng: number;
  lat: number;
}

const mapContainer = ref<HTMLElement | null>(null);
const points = ref<RoutePoint[]>([]);
const selectedRegion = ref<string[]>([]);

let map: maptalks.Map | null = null;
let markerLayer: maptalks.VectorLayer | null = null;
let lineLayer: maptalks.VectorLayer | null = null;
let line: maptalks.LineString | null = null;

const cascaderProps = {
  checkStrictly: true,
  value: 'value',
  label: 'label',
  children: 'children',
};

function syncToParent() {
  emits('update:modelValue', [...points.value]);
}

function buildMarkerSymbol(index: number) {
  return [
    {
      markerType: 'ellipse',
      markerFill: '#3b82f6',
      markerFillOpacity: 0.9,
      markerLineColor: '#ffffff',
      markerLineWidth: 2,
      markerWidth: 22,
      markerHeight: 22,
      markerDy: -11,
    },
    {
      textName: String(index + 1),
      textFill: '#ffffff',
      textSize: 12,
      textWeight: 'bold',
      textDy: -11,
    },
  ];
}

function renderAll() {
  if (!markerLayer || !lineLayer) return;

  markerLayer.clear();
  lineLayer.clear();
  line = null;

  points.value.forEach((p, index) => {
    const marker = new maptalks.Marker([p.lng, p.lat], {
      symbol: buildMarkerSymbol(index),
      draggable: !props.readonly,
      properties: { index },
    });

    if (!props.readonly) {
      marker.on('dragend', () => {
        const coord = marker.getCoordinates();
        const i = (marker.getProperties() as any).index;
        points.value[i] = { lng: coord.x, lat: coord.y };
        syncToParent();
        refreshLine();
      });

      marker.on('click', (e: any) => {
        // 阻止冒泡到 map 避免在原地再增加一个点
        if (e?.domEvent) {
          e.domEvent.stopPropagation?.();
          e.domEvent.preventDefault?.();
        }
        const i = (marker.getProperties() as any).index;
        removePoint(i);
      });
    }

    markerLayer!.addGeometry(marker);
  });

  refreshLine();
}

function refreshLine() {
  if (!lineLayer) return;
  if (line) {
    line.remove();
    line = null;
  }
  if (points.value.length >= 2) {
    line = new maptalks.LineString(
      points.value.map((p) => [p.lng, p.lat]),
      {
        symbol: {
          lineColor: '#22d3ee',
          lineWidth: 3,
          lineDasharray: [8, 4],
          lineOpacity: 0.9,
        },
      },
    );
    lineLayer.addGeometry(line);
  }
}

function onMapClick(e: any) {
  if (props.readonly) return;
  if (!e?.coordinate) return;
  const { x, y } = e.coordinate;
  points.value.push({ lng: x, lat: y });
  syncToParent();
  renderAll();
}

function removePoint(index: number) {
  if (props.readonly) return;
  if (index < 0 || index >= points.value.length) return;
  points.value.splice(index, 1);
  syncToParent();
  renderAll();
}

function clearAll() {
  if (props.readonly) return;
  points.value = [];
  syncToParent();
  renderAll();
}

function undoLast() {
  if (props.readonly) return;
  if (points.value.length === 0) return;
  points.value.pop();
  syncToParent();
  renderAll();
}

function handleRegionChange(value: string[]) {
  if (!map || !value || value.length === 0) return;
  const region = findRegionByPath(value);
  if (!region) return;
  map.animateTo(
    {
      center: [region.lng, region.lat],
      zoom: region.zoom,
    },
    { duration: 600 },
  );
}

function flyToAllPoints() {
  if (!map || points.value.length === 0) return;
  if (points.value.length === 1) {
    const p = points.value[0]!;
    map.animateTo({ center: [p.lng, p.lat], zoom: 15 }, { duration: 600 });
    return;
  }
  const lngs = points.value.map((p) => p.lng);
  const lats = points.value.map((p) => p.lat);
  const extent = new maptalks.Extent(
    Math.min(...lngs),
    Math.min(...lats),
    Math.max(...lngs),
    Math.max(...lats),
  );
  map.fitExtent(extent, 0.5);
}

// 外部 modelValue 变化时同步到内部（如打开弹窗回显）
watch(
  () => props.modelValue,
  (val) => {
    const incoming = Array.isArray(val) ? val : [];
    // 浅比较避免死循环
    if (
      incoming.length !== points.value.length ||
      incoming.some(
        (p, i) =>
          p.lng !== points.value[i]?.lng || p.lat !== points.value[i]?.lat,
      )
    ) {
      points.value = incoming.map((p) => ({ lng: p.lng, lat: p.lat }));
      renderAll();
      if (points.value.length > 0) {
        // 首次回显时飞到点位范围
        setTimeout(flyToAllPoints, 200);
      }
    }
  },
  { immediate: false, deep: true },
);

onMounted(() => {
  points.value = Array.isArray(props.modelValue)
    ? props.modelValue.map((p) => ({ lng: p.lng, lat: p.lat }))
    : [];

  // 抗宽度塌陷，延迟初始化到抽屉动画结束
  setTimeout(() => {
    if (!mapContainer.value) return;

    const initialCenter =
      points.value.length > 0
        ? [points.value[0]!.lng, points.value[0]!.lat]
        : [121.4737, 31.2304];

    map = new maptalks.Map(mapContainer.value, {
      center: initialCenter as [number, number],
      zoom: 13,
      pitch: 0,
      baseLayer: new maptalks.TileLayer('base', {
        urlTemplate:
          'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['1', '2', '3', '4'],
        attribution: '&copy; 高德地图',
      }),
    });

    markerLayer = new maptalks.VectorLayer('route-markers').addTo(map);
    lineLayer = new maptalks.VectorLayer('route-line').addTo(map);

    map.on('click', onMapClick);

    renderAll();
    if (points.value.length > 0) {
      setTimeout(flyToAllPoints, 100);
    }

    // 监听容器尺寸变化（抽屉动画结束后重新测量）
    if (typeof ResizeObserver !== 'undefined' && mapContainer.value) {
      const ro = new ResizeObserver(() => {
        map?.checkSize();
      });
      ro.observe(mapContainer.value);
      (map as any).__routeRO = ro;
    }
  }, 350);
});

onBeforeUnmount(() => {
  if (map) {
    const ro = (map as any).__routeRO as ResizeObserver | undefined;
    ro?.disconnect();
    map.off('click', onMapClick);
    map.remove();
    map = null;
  }
});

defineExpose({ clearAll, undoLast });
</script>

<template>
  <div class="route-map-picker">
    <div class="tools">
      <ElCascader
        v-model="selectedRegion"
        :options="chinaRegions as any"
        :props="cascaderProps"
        clearable
        filterable
        placeholder="搜索省/市/区"
        class="region-select"
        @change="handleRegionChange as any"
      />
      <div class="actions" v-if="!readonly">
        <ElButton
          size="small"
          @click="undoLast"
          :disabled="points.length === 0"
        >
          撤销上一点
        </ElButton>
        <ElButton
          size="small"
          type="danger"
          @click="clearAll"
          :disabled="points.length === 0"
        >
          清空
        </ElButton>
        <ElButton
          size="small"
          @click="flyToAllPoints"
          :disabled="points.length === 0"
        >
          查看全部
        </ElButton>
      </div>
    </div>

    <div class="map-wrap">
      <div ref="mapContainer" class="map-box"></div>
      <div class="tip" v-if="!readonly">
        点击地图添加点位 · 拖动点位可调整位置 · 单击点位可删除
      </div>
    </div>

    <div class="point-list">
      <div class="header">
        <span>已选点位</span>
        <span class="count">共 {{ points.length }} 个</span>
      </div>
      <div v-if="points.length === 0" class="empty">
        <ElEmpty description="暂无点位" :image-size="50" />
      </div>
      <div v-else class="list">
        <div v-for="(p, i) in points" :key="i" class="item">
          <span class="index">{{ i + 1 }}</span>
          <span class="coord">
            <span class="lbl">经度</span>
            <span class="val">{{ p.lng.toFixed(6) }}</span>
          </span>
          <span class="coord">
            <span class="lbl">纬度</span>
            <span class="val">{{ p.lat.toFixed(6) }}</span>
          </span>
          <ElButton
            v-if="!readonly"
            link
            type="danger"
            size="small"
            @click="removePoint(i)"
          >
            删除
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-map-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.region-select {
  width: 260px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.map-wrap {
  position: relative;
  width: 100%;
  height: 380px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light, #e5e7eb);
  border-radius: 6px;
}

.map-box {
  width: 100%;
  height: 100%;
}

.tip {
  position: absolute;
  bottom: 10px;
  left: 12px;
  padding: 4px 10px;
  font-size: 12px;
  color: #fff;
  pointer-events: none;
  background: rgb(30 41 59 / 70%);
  border-radius: 4px;
}

.point-list {
  max-height: 180px;
  overflow: auto;
  border: 1px solid var(--el-border-color-light, #e5e7eb);
  border-radius: 6px;
}

.point-list .header {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  background: var(--el-fill-color-light, #f5f7fa);
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
}

.point-list .count {
  font-family: 'JetBrains Mono', monospace;
  color: var(--el-color-primary, #409eff);
}

.point-list .empty {
  padding: 8px 0;
}

.point-list .list {
  display: flex;
  flex-direction: column;
}

.point-list .item {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  border-bottom: 1px dashed var(--el-border-color-lighter, #f0f0f0);
}

.point-list .item:last-child {
  border-bottom: none;
}

.point-list .index {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  background: #3b82f6;
  border-radius: 50%;
}

.point-list .coord {
  display: inline-flex;
  gap: 4px;
}

.point-list .coord .lbl {
  color: var(--el-text-color-secondary, #909399);
}

.point-list .coord .val {
  font-family: 'JetBrains Mono', monospace;
  color: var(--el-text-color-primary, #303133);
}
</style>
