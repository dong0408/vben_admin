<script lang="ts" setup>
import type { AlertApi } from '#/api/alert';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { ElButton, ElTag } from 'element-plus';

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
} from '../data';
import AlertDetail from './alert-detail.vue';

interface Props {
  /** 模式：realtime-实时预警（自动刷新），history-预警历史 */
  mode: 'history' | 'realtime';
  /** 自动刷新间隔（毫秒），仅实时模式生效 */
  refreshInterval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  refreshInterval: 10_000,
});

const fetchApi =
  props.mode === 'realtime' ? getAlertListApi : getAlertHistoryListApi;

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: AlertDetail,
  destroyOnClose: true,
});

function onDetail(row: AlertApi.AlertItem) {
  detailDrawerApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
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
        query: async ({ page }, formValues) => {
          return await fetchApi({
            current: page.currentPage,
            size: page.pageSize,
            ...formValues,
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

const timer = ref<null | ReturnType<typeof setInterval>>(null);

function startPolling() {
  if (props.mode !== 'realtime' || props.refreshInterval <= 0) return;
  stopPolling();
  timer.value = setInterval(() => {
    gridApi.query();
  }, props.refreshInterval);
}

function stopPolling() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

onMounted(() => {
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<template>
  <Grid>
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
  </Grid>
  <DetailDrawer />
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
</style>
