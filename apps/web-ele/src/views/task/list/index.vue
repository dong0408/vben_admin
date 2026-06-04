<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { $t } from '@vben/locales';

import { ElButton, ElMessage, ElProgress, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUserApi,
  getUserListApi,
  resetPasswordApi,
} from '#/api/system/user';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

interface SystemUser {
  id: string;
  account: string;
  name: string;
  realName: string;
  phone?: string;
  deptName?: string;
  roleName?: string;
  createTime?: string;
}
const router = useRouter();
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: false,
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      response: { result: 'records', total: 'total' },
      ajax: {
        query: async ({ page }) => {
          const res = await getUserListApi({
            current: page.currentPage,
            size: page.pageSize,
          });
          return res;
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

function onEdit(row: SystemUser) {
  formDrawerApi.setData({ ...row, mode: 'edit' }).open();
}

function onDelete(row: SystemUser) {
  const loading = ElMessage({
    message: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    type: 'warning',
  });
  // 删除API调用（根据实际API调整）
  deleteUserApi(row.id)
    .then(() => {
      ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
      onRefresh();
    })
    .finally(() => {
      loading.close();
    });
  loading.close();
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}
const [Modal, modalApi] = useVbenModal({
  // 连接抽离的组件
  destroyOnClose: true,
  fullscreenButton: false,
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      // 打开弹框时设置当前行数据
      modalApi.setData({ currentRow: modalApi.getData() });
    }
  },

  async onConfirm() {
    if (!currentResetRow) return;

    const loading = ElMessage({
      message: '正在重置密码...',
      duration: 0,
      type: 'warning',
    });

    try {
      await resetPasswordApi({ ids: currentResetRow.id });
      ElMessage.success('密码重置成功，默认密码已重置为 123456');
      modalApi.close();
    } catch (error) {
      console.error('重置密码失败:', error);
    } finally {
      loading.close();
      currentResetRow = null;
    }
  },
});
let currentResetRow: null | SystemUser = {} as SystemUser;

function onActionClick({ code, row }: any) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'detail': {
      router.push({ path: '/task/detail', query: { id: row.id } });
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
    <Modal />
    <FormDrawer @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <ElButton type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create') }}
        </ElButton>
      </template>
      <template #priority="{ row }">
        <ElTag type="success">{{ row.realName }}</ElTag>
      </template>
      <template #progress="{ row }">
        <ElProgress :percentage="50" />
      </template>
      <template #action="{ row }">
        <ElButton
          type="primary"
          link
          size="small"
          @click="onEdit(row)"
          v-access:code="'system_user_edit'"
        >
          {{ $t('common.edit') }}
        </ElButton>
        <ElButton
          type="danger"
          link
          size="small"
          @click="onDelete(row)"
          v-access:code="'system_user_delete'"
        >
          {{ $t('common.delete') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
