<script lang="ts" setup>
import type { VehicleData } from '../mock';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import * as maptalks from 'maptalks';

import helloImg from '#/assets/images/hello.png';

import { getMockVehicles } from '../mock';

import 'maptalks/dist/maptalks.css';

defineOptions({ name: 'MonitorDetailModule' });

const route = useRoute();
const router = useRouter();
const mapContainer = ref<HTMLElement | null>(null);

let map: maptalks.Map | null = null;
let vehicleLayer: maptalks.VectorLayer | null = null;
const cardDict = new Map<string, maptalks.ui.UIMarker>();

const vehicleId = computed(() => (route.query.id as string) || 'V001');
const vehicleData = ref<null | VehicleData>(null);

let simulationTimer: ReturnType<typeof setInterval>;

// Get Vehicle Color
const getVehicleColor = (status: VehicleData['status']) => {
  switch (status) {
    case 'offline': {
      return '#6b7280';
    }
    case 'running': {
      return '#10b981';
    }
    case 'stopped': {
      return '#f59e0b';
    }
    default: {
      return '#10b981';
    }
  }
};

const generateVehicleSymbol = (v: VehicleData) => {
  return [
    {
      markerType: 'path',
      markerPath:
        'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM7.5 16A1.5 1.5 0 1 1 7.5 13a1.5 1.5 0 0 1 0 3zm9 0A1.5 1.5 0 1 1 16.5 13a1.5 1.5 0 0 1 0 3z',
      markerPathWidth: 24,
      markerPathHeight: 24,
      markerWidth: 32,
      markerHeight: 32,
      markerFill: getVehicleColor(v.status),
      markerLineColor: '#ffffff',
      markerLineWidth: 1,
      markerDx: 0,
      markerDy: -16,
    },
  ];
};

const updateVehicleMap = () => {
  if (!map || !vehicleLayer || !vehicleData.value) return;
  const v = vehicleData.value;

  // Center map smoothly without disturbing user drag heavily
  map.setCenter([v.lng, v.lat]);

  // Update Geometry
  let marker = vehicleLayer.getGeometryById(v.id) as maptalks.Marker;
  if (marker) {
    marker.setCoordinates([v.lng, v.lat]);
    marker.setSymbol(generateVehicleSymbol(v));
  } else {
    marker = new maptalks.Marker([v.lng, v.lat], {
      id: v.id,
      symbol: generateVehicleSymbol(v),
    });
    vehicleLayer.addGeometry(marker);
  }

  // Update Card UI Marker (Adapted to Light Theme Map Tooltip)
  let card = cardDict.get(v.id);
  const htmlContent = `
    <div class="relative bg-white/90 border border-blue-200 backdrop-blur-md rounded-lg shadow-lg w-[140px] pointer-events-none mt-[-16px]">
      <div class="px-2 py-1 border-b border-gray-100 bg-blue-50/50 flex items-center justify-between rounded-t-lg">
         <span class="text-blue-600 font-semibold text-[11px] tracking-wider">${v.plate}</span>
         <span class="w-2 h-2 rounded-full ${v.status === 'running' ? 'bg-emerald-400' : v.status === 'stopped' ? 'bg-amber-400' : 'bg-gray-400'}"></span>
      </div>
      <div class="p-2 text-center text-gray-700 text-xs font-mono font-medium">
         SPEED: ${v.speed} km/h
      </div>
      <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gradient-to-t from-transparent to-blue-400/50"></div>
    </div>
  `;
  if (card) {
    card.setCoordinates([v.lng, v.lat]);
    card.setContent(htmlContent);
  } else {
    card = new maptalks.ui.UIMarker([v.lng, v.lat], {
      content: htmlContent,
      dy: -32,
      dx: 0,
      eventsPropagation: false,
    });
    card.addTo(map);
    cardDict.set(v.id, card);
  }
};

const tickSimulation = () => {
  const v = getMockVehicles().find((v) => v.id === vehicleId.value);
  if (!v) return;
  // Make some random movement simulation
  // Since we are looking at detail, let's just make it drift slightly if running
  if (vehicleData.value && vehicleData.value.status === 'running') {
    v.lng = vehicleData.value.lng + (Math.random() - 0.5) * 0.001;
    v.lat = vehicleData.value.lat + (Math.random() - 0.5) * 0.001;
    v.speed = Math.floor(Math.random() * 20) + 40;
    v.taskProgress = Math.min(
      100,
      vehicleData.value.taskProgress + Math.floor(Math.random() * 3),
    );
    if (v.taskProgress >= 100) v.taskProgress = 0;
  }
  vehicleData.value = v;
  updateVehicleMap();
};

onMounted(() => {
  const initialV = getMockVehicles().find((v) => v.id === vehicleId.value);
  if (initialV) vehicleData.value = { ...initialV };

  // 延迟初始化地图，防止 Vue Router 转场动画期间 DOM 高度为 0 导致渲染彻底卡死和页面空白
  setTimeout(() => {
    if (mapContainer.value) {
      map = new maptalks.Map(mapContainer.value, {
        center: vehicleData.value
          ? [vehicleData.value.lng, vehicleData.value.lat]
          : [121.4737, 31.2304],
        zoom: 15,
        pitch: 45,
        baseLayer: new maptalks.TileLayer('base', {
          // High quality light theme road map (Amap or CartoDB Positron)
          urlTemplate:
            'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          subdomains: ['1', '2', '3', '4'],
          attribution: '&copy; 高德地图',
        }),
      });
      vehicleLayer = new maptalks.VectorLayer('vehicles', {
        enableAltitude: true,
        altitudeProperty: 'altitude',
      }).addTo(map);

      updateVehicleMap();
    }
  }, 300);

  simulationTimer = setInterval(tickSimulation, 2000);
});

onUnmounted(() => {
  if (simulationTimer) clearInterval(simulationTimer);
  if (map) map.remove();
});

const tableData = [
  {
    id: 1,
    driveStatus: '智驾',
    speed: '6km/h',
    health: '80%',
    workStatus: '冲洗',
    progress: 25,
    priority: '高',
    priorityColor: 'text-red-500',
    status: '执行中',
    name: 'XX街道冲洗...',
    taskId: 'T001',
  },
  {
    id: 2,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '中',
    priorityColor: 'text-amber-500',
    status: '未执行',
    name: 'XX街道抑尘...',
    taskId: 'T002',
  },
  {
    id: 3,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '中',
    priorityColor: 'text-amber-500',
    status: '未执行',
    name: 'XX街道冲洗...',
    taskId: 'T003',
  },
  {
    id: 4,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '中',
    priorityColor: 'text-amber-500',
    status: '未执行',
    name: 'XX街道抑尘...',
    taskId: 'T004',
  },
  {
    id: 5,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '低',
    priorityColor: 'text-emerald-500',
    status: '未执行',
    name: 'XX街道冲洗...',
    taskId: 'T005',
  },
  {
    id: 6,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '低',
    priorityColor: 'text-emerald-500',
    status: '未执行',
    name: 'XX街道抑尘...',
    taskId: 'T006',
  },
  {
    id: 7,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '低',
    priorityColor: 'text-emerald-500',
    status: '未执行',
    name: 'XX街道冲洗...',
    taskId: 'T007',
  },
  {
    id: 8,
    driveStatus: '/',
    speed: '0km/h',
    health: '80%',
    workStatus: '/',
    progress: 0,
    priority: '低',
    priorityColor: 'text-emerald-500',
    status: '未执行',
    name: 'XX街道抑尘...',
    taskId: 'T008',
  },
];

const goBack = () => router.push('/monitor');
</script>

<template>
  <Page
    auto-content-height
    class="h-full overflow-hidden bg-gray-50 !p-0 font-sans"
  >
    <!-- 通过添加显式的包裹层解决 Vben5 Page 组件对于 flex 直接作用失效导致的页面 0 宽高黑屏塌陷问题 -->
    <div class="flex size-full min-h-[600px] flex-1">
      <!-- LEFT PANEL: VEHILE STATS (60%) -->
      <div
        class="custom-scrollbar flex h-full w-[60%] flex-col gap-4 overflow-y-auto bg-gray-50 p-4"
      >
        <!-- Top Section: Image & Stats -->
        <div class="flex h-[40%] min-h-[300px] gap-4">
          <!-- Top Left: Vehicle Image -->
          <div
            class="relative flex w-1/2 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
          >
            <!-- Header inside block -->
            <div
              class="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-3"
            >
              <div class="flex items-center gap-2">
                <div class="h-4 w-1 rounded-sm bg-blue-500"></div>
                <span class="flex items-center text-sm font-bold text-gray-800">
                  当前驾驶车辆
                  <button
                    @click="goBack"
                    class="ml-3 cursor-pointer rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 shadow-sm transition-colors hover:bg-gray-200"
                  >
                    返回全局
                  </button>
                </span>
              </div>
              <span class="text-xs text-gray-500">在线时间：15h30min50s</span>
            </div>
            <!-- Image area -->
            <div
              class="relative flex flex-1 items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 p-4"
            >
              <img
                :src="helloImg"
                alt="vehicle"
                class="max-h-full max-w-full object-contain"
              />
              <div
                class="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-md border border-gray-200 bg-white/80 px-2 py-1 shadow-sm backdrop-blur"
              >
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span class="text-xs font-semibold text-gray-700"
                  >车辆ID: {{ vehicleId }}</span
                >
              </div>
            </div>
          </div>

          <!-- Top Right: Stats Grid -->
          <div class="grid w-1/2 grid-cols-2 grid-rows-3 gap-3">
            <div
              class="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <span class="font-mono text-2xl font-bold text-emerald-600"
                >{{ vehicleData?.speed || 0
                }}<span class="text-sm">km/h</span></span
              >
              <span class="text-xs font-medium text-gray-500">实时车速</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <span class="font-mono text-2xl font-bold text-emerald-600"
                >N档</span
              >
              <span class="text-xs font-medium text-gray-500">当前档位</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <span class="font-mono text-2xl font-bold text-blue-500"
                >2<span class="text-sm">°</span></span
              >
              <span class="text-xs font-medium text-gray-500">转向角度</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <span class="font-mono text-2xl font-bold text-amber-500"
                >65<span class="text-sm">%</span></span
              >
              <span class="text-xs font-medium text-gray-500">剩余电量</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <span class="font-mono text-2xl font-bold text-amber-500"
                >600<span class="text-sm">km</span></span
              >
              <span class="text-xs font-medium text-gray-500">续航里程</span>
            </div>
            <div
              class="flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white shadow-sm"
            >
              <span class="font-mono text-2xl font-bold text-gray-800"
                >80<span class="text-sm">%</span></span
              >
              <span class="text-xs font-medium text-gray-500">剩余水量</span>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Task Table -->
        <div
          class="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <div class="h-full w-full overflow-x-auto p-4">
            <table
              class="w-full whitespace-nowrap text-left text-sm text-gray-600"
            >
              <thead class="bg-gray-50/50 text-xs uppercase text-gray-500">
                <tr>
                  <th
                    class="border-b border-gray-200 px-4 py-3 text-center font-semibold"
                  >
                    序号
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    驾驶状态
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    当前速度
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    健康度
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    作业状态
                  </th>
                  <th
                    class="w-32 border-b border-gray-200 px-4 py-3 font-semibold"
                  >
                    任务进度
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    任务优先级
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    任务状态
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    任务名称
                  </th>
                  <th class="border-b border-gray-200 px-4 py-3 font-semibold">
                    任务ID
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in tableData"
                  :key="idx"
                  class="border-b border-gray-50 transition-colors hover:bg-gray-50"
                >
                  <td class="px-4 py-3 text-center text-gray-400">
                    {{ row.id }}
                  </td>
                  <td class="px-4 py-3">{{ row.driveStatus }}</td>
                  <td class="px-4 py-3">{{ row.speed }}</td>
                  <td class="px-4 py-3">{{ row.health }}</td>
                  <td class="px-4 py-3">{{ row.workStatus }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="min-w-[24px] font-mono text-[10px] font-semibold text-blue-500"
                        >{{ row.progress }}%</span
                      >
                      <div
                        class="h-1.5 w-full max-w-[60px] rounded-full bg-blue-100"
                      >
                        <div
                          class="h-1.5 rounded-full bg-blue-500"
                          :style="{ width: `${row.progress}%` }"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-bold" :class="row.priorityColor">
                    {{ row.priority }}
                  </td>
                  <td class="px-4 py-3">{{ row.status }}</td>
                  <td class="px-4 py-3">{{ row.name }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-400">
                    {{ row.taskId }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: MAP (40%) -->
      <div
        class="group relative h-full w-[40%] border-l border-gray-200 bg-gray-100"
      >
        <div
          class="pointer-events-none absolute right-4 top-4 z-10 rounded-xl border border-gray-200 bg-white/90 p-2 shadow-sm backdrop-blur"
        >
          <h3 class="text-xs font-semibold tracking-wider text-gray-500">
            实时追踪 TRACKING
          </h3>
        </div>
        <div ref="mapContainer" class="h-full w-full focus:outline-none"></div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
@keyframes progress-stripe {
  from {
    background-position: 1rem 0;
  }

  to {
    background-position: 0 0;
  }
}

/* Custom Scrollbar for Light Theme */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(156 163 175 / 30%);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgb(156 163 175 / 50%);
}
</style>
