<script lang="ts" setup>
import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElMessage,
  ElSpace,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

interface PermissionItem {
  id: string;
  name: string;
  code: string;
  type: string;
  path: string;
  status: number;
  createTime: string;
  remark: string;
  children?: PermissionItem[];
}

const [SearchForm, searchApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '权限名称',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '权限编码',
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        options: [
          { value: '', label: '全部' },
          { value: '1', label: '启用' },
          { value: '0', label: '禁用' },
        ],
      },
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-3 gap-4',
});

const [PermissionForm, permApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '权限名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '权限编码',
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '权限类型',
      rules: 'selectRequired',
      componentProps: {
        options: [
          { value: 'menu', label: '菜单' },
          { value: 'button', label: '按钮' },
          { value: 'api', label: '接口' },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'path',
      label: '路由路径',
    },
    {
      component: 'Input',
      fieldName: 'component',
      label: '组件路径',
    },
    {
      component: 'Input',
      fieldName: 'icon',
      label: '图标',
    },
    {
      component: 'RadioGroup',
      fieldName: 'status',
      label: '状态',
      defaultValue: 1,
      componentProps: {
        options: [
          { value: 1, label: '启用' },
          { value: 0, label: '禁用' },
        ],
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: '排序',
      defaultValue: 0,
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        rows: 4,
      },
    },
  ],
});

const [PermissionModal, permissionModalApi] = useVbenModal({
  fullscreenButton: false,
  title: '权限信息',
  draggable: true,
});

const tableLoading = ref(false);
const tableData = ref<PermissionItem[]>([]);
const selectedRowKeys = ref<string[]>([]);

const searchFormData = ref({
  name: '',
  code: '',
  status: '',
});

const mockPermissions: PermissionItem[] = [
  {
    id: '1',
    name: '系统管理',
    code: 'system',
    type: 'menu',
    path: '/system',
    status: 1,
    createTime: '2024-01-01 10:00:00',
    remark: '系统管理模块',
    sort: 1,
    children: [
      {
        id: '1-1',
        name: '用户管理',
        code: 'system:user',
        type: 'menu',
        path: '/system/user',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '用户管理',
        sort: 1,
      },
      {
        id: '1-2',
        name: '角色管理',
        code: 'system:role',
        type: 'menu',
        path: '/system/role',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '角色管理',
        sort: 2,
      },
      {
        id: '1-3',
        name: '权限管理',
        code: 'system:permission',
        type: 'menu',
        path: '/system/permission',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '权限管理',
        sort: 3,
      },
      {
        id: '1-4',
        name: '菜单管理',
        code: 'system:menu',
        type: 'menu',
        path: '/system/menu',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '菜单管理',
        sort: 4,
      },
    ],
  },
  {
    id: '2',
    name: '仪表盘',
    code: 'dashboard',
    type: 'menu',
    path: '/dashboard',
    status: 1,
    createTime: '2024-01-01 10:00:00',
    remark: '仪表盘',
    sort: 2,
    children: [
      {
        id: '2-1',
        name: '工作台',
        code: 'dashboard:workspace',
        type: 'menu',
        path: '/workspace',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '工作台',
        sort: 1,
      },
      {
        id: '2-2',
        name: '数据分析',
        code: 'dashboard:analytics',
        type: 'menu',
        path: '/analytics',
        status: 1,
        createTime: '2024-01-01 10:00:00',
        remark: '数据分析',
        sort: 2,
      },
    ],
  },
];

async function fetchTableData() {
  tableLoading.value = true;
  try {
    const { name, code, status } = searchFormData.value;

    const filterNode = (node: PermissionItem) => {
      let match = true;
      if (name && !node.name.includes(name)) {
        match = false;
      }
      if (code && !node.code.includes(code)) {
        match = false;
      }
      if (status !== '' && node.status !== Number.parseInt(status)) {
        match = false;
      }
      return match;
    };

    const filterTree = (nodes: PermissionItem[]): PermissionItem[] => {
      return nodes.filter(filterNode).map((node) => ({
        ...node,
        children: node.children ? filterTree(node.children) : undefined,
      }));
    };

    tableData.value = filterTree(mockPermissions);
  } catch {
    ElMessage.error('获取权限列表失败');
  } finally {
    tableLoading.value = false;
  }
}

async function handleSearch() {
  searchFormData.value = await searchApi.getValues();
  fetchTableData();
}

function handleReset() {
  searchApi.resetForm();
  searchFormData.value = {
    name: '',
    code: '',
    status: '',
  };
  fetchTableData();
}

function handleAdd(parentId?: string) {
  permApi.resetForm();
  if (parentId) {
    permApi.setValues({ parentId });
  }
  permissionModalApi.open();
}

function handleEdit(row: PermissionItem) {
  permApi.setValues(row);
  permissionModalApi.open();
}

function handleDelete(row: PermissionItem) {
  ElMessage.warning('删除功能待实现');
}

function handleStatusChange(row: PermissionItem) {
  ElMessage.success(`权限状态已更新为：${row.status ? '启用' : '禁用'}`);
}

async function handlePermissionSubmit(values: any) {
  ElMessage.success('权限保存成功');
  permissionModalApi.close();
  fetchTableData();
}

function getTagType(type: string) {
  const map: Record<string, any> = {
    menu: 'primary',
    button: 'success',
    api: 'warning',
  };
  return map[type] || 'info';
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    menu: '菜单',
    button: '按钮',
    api: '接口',
  };
  return map[type] || type;
}

fetchTableData();
</script>

<template>
  <Page title="权限管理">
    <ElCard>
      <div class="mb-4">
        <div class="mb-2 text-sm font-medium">搜索条件</div>
        <div class="flex items-end gap-2">
          <div class="flex-1">
            <SearchForm />
          </div>
          <ElSpace>
            <ElButton type="primary" @click="handleSearch">搜索</ElButton>
            <ElButton @click="handleReset">重置</ElButton>
            <ElButton type="primary" @click="handleAdd()">新增权限</ElButton>
            <ElButton
              type="primary"
              @click="() => ElMessage.info('请选择父节点后再点击新增')"
            >
              新增子权限
            </ElButton>
          </ElSpace>
        </div>
      </div>

      <ElTable
        v-loading="tableLoading"
        :data="tableData"
        stripe
        border
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <ElTableColumn prop="name" label="权限名称" min-width="200" />
        <ElTableColumn prop="code" label="权限编码" min-width="180" />
        <ElTableColumn label="类型" width="100">
          <template #default="{ row }">
            <ElTag :type="getTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn
          prop="path"
          label="路由路径"
          min-width="180"
          show-overflow-tooltip
        />
        <ElTableColumn prop="sort" label="排序" width="80" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" min-width="180" />
        <ElTableColumn
          prop="remark"
          label="备注"
          min-width="200"
          show-overflow-tooltip
        />
        <ElTableColumn label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <ElSpace>
              <ElButton
                type="primary"
                link
                size="small"
                @click="handleAdd(row.id)"
              >
                新增子权限
              </ElButton>
              <ElButton
                type="primary"
                link
                size="small"
                @click="handleEdit(row)"
              >
                编辑
              </ElButton>
              <ElButton
                type="danger"
                link
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </ElButton>
              <ElSwitch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                @change="handleStatusChange(row)"
              />
            </ElSpace>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <PermissionModal @confirm="handlePermissionSubmit">
      <div class="p-4">
        <PermissionForm />
      </div>
    </PermissionModal>
  </Page>
</template>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
