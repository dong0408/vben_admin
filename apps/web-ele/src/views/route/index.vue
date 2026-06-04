<script lang="ts" setup>
import type { RouteApi } from '#/api/route';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import {
  ElButton,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRouteApi,
  getRouteListApi,
  toggleRouteStatusApi,
} from '#/api/route';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'RouteManagement' });

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: false,
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      response: { result: 'records', total: 'total' },
      ajax: {
        query: async ({ page, form }: any) => {
          return await getRouteListApi({
            current: page.currentPage,
            size: page.pageSize,
            ...(form as RouteApi.RouteQueryParams),
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  },
});

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: RouteApi.RouteItem) {
  formDrawerApi.setData({ ...row }).open();
}

function onDelete(row: RouteApi.RouteItem) {
  ElMessageBox.confirm(`确认删除路线「${row.name}」吗？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteRouteApi(row.id);
      ElMessage.success('删除成功');
      onRefresh();
    })
    .catch(() => {});
}

async function onToggleStatus(row: RouteApi.RouteItem, next: number) {
  try {
    await toggleRouteStatusApi(row.id, next);
    row.status = next;
    ElMessage.success(next === 1 ? '已启用' : '已禁用');
  } catch {
    // 回滚 UI 切换
    row.status = next === 1 ? 0 : 1;
    ElMessage.error('操作失败，请重试');
  }
}

function onActionClick({ code, row }: any) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    default: {
      break;
    }
  }
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增路线
        </ElButton>
      </template>

      <template #points="{ row }">
        <ElTag type="info">
          {{ (row as RouteApi.RouteItem).points?.length || 0 }} 个
        </ElTag>
      </template>

      <template #status="{ row }">
        <ElSwitch
          :model-value="(row as RouteApi.RouteItem).status === 1"
          :active-value="true"
          :inactive-value="false"
          active-text="启用"
          inactive-text="禁用"
          inline-prompt
          @change="
            (val) => onToggleStatus(row as RouteApi.RouteItem, val ? 1 : 0)
          "
        />
      </template>

      <template #action="{ row }">
        <ElButton
          type="primary"
          link
          size="small"
          @click="onEdit(row as RouteApi.RouteItem)"
        >
          编辑
        </ElButton>
        <ElButton
          :type="
            (row as RouteApi.RouteItem).status === 1 ? 'warning' : 'success'
          "
          link
          size="small"
          @click="
            onToggleStatus(
              row as RouteApi.RouteItem,
              (row as RouteApi.RouteItem).status === 1 ? 0 : 1,
            )
          "
        >
          {{ (row as RouteApi.RouteItem).status === 1 ? '禁用' : '启用' }}
        </ElButton>
        <ElButton
          type="danger"
          link
          size="small"
          @click="onDelete(row as RouteApi.RouteItem)"
        >
          删除
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
