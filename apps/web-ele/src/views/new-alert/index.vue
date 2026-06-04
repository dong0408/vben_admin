<script lang="ts" setup>
import type { AlertApi } from '#/api/alert';

import { onBeforeUnmount, ref, watch } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElRadioButton, ElRadioGroup, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAlertHistoryListApi, getAlertListApi } from '#/api/alert';

import {
  categoryLabelMap,
  priorityLabelMap,
  priorityTagMap,
  statusLabelMap,
  statusTagMap,
  useColumns,
  useGridFormSchema,
} from './data';

defineOptions({ name: 'NewAlert' });

type AlertTab = 'history' | 'realtime';

const activeTab = ref<AlertTab>('realtime');

const REFRESH_INTERVAL = 10_000;

// ============== 实时预警 Grid ==============
const [RealtimeGrid, realtimeGridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['alertTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: false,
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      response: { result: 'records', total: 'total' },
      ajax: {
        query: async ({ page, form }: any) => {
          return await getAlertListApi({
            current: page.currentPage,
            size: page.pageSize,
            ...form,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    rowClassName: ({ row }: { row: AlertApi.AlertItem }) => {
      if (row.priority === '1') return 'alert-row-high';
      if (row.priority === '2') return 'alert-row-medium';
      if (row.priority === '3') return 'alert-row-low';
      return '';
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
});

// ============== 预警历史 Grid ==============
const [HistoryGrid, historyGridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['alertTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: false,
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      response: { result: 'records', total: 'total' },
      ajax: {
        query: async ({ page, form }: any) => {
          return await getAlertHistoryListApi({
            current: page.currentPage,
            size: page.pageSize,
            ...form,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    rowClassName: ({ row }: { row: AlertApi.AlertItem }) => {
      if (row.priority === '1') return 'alert-row-high';
      if (row.priority === '2') return 'alert-row-medium';
      if (row.priority === '3') return 'alert-row-low';
      return '';
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
});

// ============== 详情抽屉 ==============
const detailRow = ref<null | Partial<AlertApi.AlertItem>>(null);

const detailItems = [
  { label: '车辆编码', key: 'vehicleCode' as const },
  { label: '预警类型', key: 'category' as const },
  { label: '优先级', key: 'priority' as const },
  { label: '预警时间', key: 'alertTime' as const },
  { label: '故障码', key: 'faultCode' as const },
  { label: '故障描述', key: 'faultDescription' as const },
];

function formatDetailValue(key: keyof AlertApi.AlertItem) {
  const raw = detailRow.value?.[key];
  if (raw === undefined || raw === null || raw === '') return '-';
  if (key === 'category') return categoryLabelMap[String(raw)] || String(raw);
  if (key === 'priority') return priorityLabelMap[String(raw)] || String(raw);
  return String(raw);
}

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  closable: true,
  showCancelButton: false,
  showConfirmButton: false,
  title: '预警详情',
  onClosed() {
    detailRow.value = null;
  },
});

function onDetail(row: AlertApi.AlertItem) {
  detailRow.value = row;
  detailDrawerApi.open();
}

// ============== 实时轮询 ==============
let timer: null | ReturnType<typeof setInterval> = null;

function startPolling() {
  stopPolling();
  timer = setInterval(() => {
    if (activeTab.value === 'realtime') {
      realtimeGridApi.query();
    }
  }, REFRESH_INTERVAL);
}

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// 监听 tab 切换：实时模式开启轮询，历史模式停掉
watch(
  activeTab,
  (tab) => {
    if (tab === 'realtime') {
      startPolling();
    } else {
      stopPolling();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <Page auto-content-height>
    <div class="mb-3 flex items-center justify-between">
      <ElRadioGroup v-model="activeTab">
        <ElRadioButton value="realtime">实时预警</ElRadioButton>
        <ElRadioButton value="history">预警历史</ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- 实时预警表格 -->
    <RealtimeGrid v-show="activeTab === 'realtime'">
      <template #priority="{ row }">
        <ElTag :type="priorityTagMap[row.priority] || 'info'">
          {{ priorityLabelMap[row.priority] || row.priority }}
        </ElTag>
      </template>
      <template #category="{ row }">
        {{ categoryLabelMap[row.category] || row.category }}
      </template>
      <template #status="{ row }">
        <ElTag :type="statusTagMap[row.status] || 'info'">
          {{ statusLabelMap[row.status] || row.status }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <ElButton type="primary" link size="small" @click="onDetail(row)">
          详情
        </ElButton>
      </template>
    </RealtimeGrid>

    <!-- 预警历史表格 -->
    <HistoryGrid v-show="activeTab === 'history'">
      <template #priority="{ row }">
        <ElTag :type="priorityTagMap[row.priority] || 'info'">
          {{ priorityLabelMap[row.priority] || row.priority }}
        </ElTag>
      </template>
      <template #category="{ row }">
        {{ categoryLabelMap[row.category] || row.category }}
      </template>
      <template #status="{ row }">
        <ElTag :type="statusTagMap[row.status] || 'info'">
          {{ statusLabelMap[row.status] || row.status }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <ElButton type="primary" link size="small" @click="onDetail(row)">
          详情
        </ElButton>
      </template>
    </HistoryGrid>

    <!-- 详情抽屉：内容直接写在外层模板，避免 connectedComponent 引发渲染异常 -->
    <DetailDrawer class="w-[480px]">
      <div class="alert-detail">
        <div
          v-for="item in detailItems"
          :key="item.key"
          class="alert-detail__item"
        >
          <span class="alert-detail__label">{{ item.label }}：</span>
          <span class="alert-detail__value">{{
            formatDetailValue(item.key)
          }}</span>
        </div>
      </div>
    </DetailDrawer>
  </Page>
</template>

<style scoped>
:deep(.alert-row-high) {
  background-color: rgb(254 226 226) !important;
}

:deep(.alert-row-high:hover > td) {
  background-color: rgb(252 200 200) !important;
}

:deep(.alert-row-medium) {
  background-color: rgb(254 249 195 / 60%) !important;
}

:deep(.alert-row-low) {
  background-color: rgb(220 252 231 / 50%) !important;
}

.alert-detail {
  padding: 4px 0;
}

.alert-detail__item {
  display: block;
  padding: 10px 0;
  font-size: 14px;
  line-height: 1.6;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.alert-detail__item:last-child {
  border-bottom: none;
}

.alert-detail__label {
  display: inline-block;
  min-width: 80px;
  color: var(--el-text-color-secondary);
}

.alert-detail__value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>
