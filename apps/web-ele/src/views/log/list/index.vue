<script lang="ts" setup>
import type { LogApi } from '#/api/log';

import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getLogListApi } from '#/api/log';

import { useColumns, useGridFormSchema } from './data';

const route = useRoute();

const logType = computed<LogApi.LogType>(
  () => (route.meta.logType as LogApi.LogType) || 'vehicle',
);

const operationTypeMap: Record<string, string> = {
  1: '新增',
  2: '编辑',
  3: '删除',
  4: '查询',
  5: '导入',
  6: '导出',
};

const operationTypeTagMap: Record<string, string> = {
  1: 'success',
  2: 'warning',
  3: 'danger',
  4: 'info',
  5: '',
  6: '',
};

const [Grid] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: false,
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      response: { result: 'records', total: 'total' },
      ajax: {
        query: async ({ page }) => {
          return await getLogListApi({
            current: page.currentPage,
            size: page.pageSize,
            logType: logType.value,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
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
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #operationType="{ row }">
        <ElTag :type="operationTypeTagMap[row.operationType] || 'info'">
          {{ operationTypeMap[row.operationType] || row.operationType }}
        </ElTag>
      </template>
      <template #result="{ row }">
        <ElTag :type="row.result === '1' ? 'success' : 'danger'">
          {{ row.result === '1' ? '成功' : '失败' }}
        </ElTag>
      </template>
    </Grid>
  </Page>
</template>
