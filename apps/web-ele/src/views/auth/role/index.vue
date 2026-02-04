<script lang="ts" setup>
import { ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { ElButton, ElCard, ElMessage, ElTag, ElSpace, ElTable, ElTableColumn, ElSwitch } from 'element-plus';

import { useVbenForm } from '#/adapter/form';

interface RoleItem {
  id: string;
  name: string;
  code: string;
  status: number;
  createTime: string;
  remark: string;
  permissions: string[];
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
      label: '角色名称',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色编码',
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

const [RoleForm, roleApi] = useVbenForm({
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
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色编码',
      rules: 'required',
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
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: {
        rows: 4,
      },
    },
  ],
});

const [RoleModal, roleModalApi] = useVbenModal({
  fullscreenButton: false,
  title: '角色信息',
  draggable: true,
});

const [PermissionDrawer, permissionDrawerApi] = useVbenDrawer({
  title: '分配权限',
  class: 'w-[600px]',
});

const tableLoading = ref(false);
const tableData = ref<RoleItem[]>([]);
const selectedRowKeys = ref<string[]>([]);

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
});

const searchFormData = ref({
  name: '',
  code: '',
  status: '',
});

const mockRoles: RoleItem[] = [
  {
    id: '1',
    name: '超级管理员',
    code: 'super_admin',
    status: 1,
    createTime: '2024-01-01 10:00:00',
    remark: '拥有系统所有权限',
    permissions: ['all'],
  },
  {
    id: '2',
    name: '管理员',
    code: 'admin',
    status: 1,
    createTime: '2024-01-02 10:00:00',
    remark: '拥有部分管理权限',
    permissions: ['user:list', 'role:list'],
  },
  {
    id: '3',
    name: '普通用户',
    code: 'user',
    status: 1,
    createTime: '2024-01-03 10:00:00',
    remark: '普通用户权限',
    permissions: ['dashboard:view'],
  },
  {
    id: '4',
    name: '访客',
    code: 'guest',
    status: 0,
    createTime: '2024-01-04 10:00:00',
    remark: '访客权限',
    permissions: [],
  },
];

async function fetchTableData() {
  tableLoading.value = true;
  try {
    const { name, code, status } = searchFormData.value;
    let filteredData = [...mockRoles];
    
    if (name) {
      filteredData = filteredData.filter(item => item.name.includes(name));
    }
    if (code) {
      filteredData = filteredData.filter(item => item.code.includes(code));
    }
    if (status !== '') {
      filteredData = filteredData.filter(item => item.status === parseInt(status));
    }
    
    const start = (pagination.value.page - 1) * pagination.value.pageSize;
    const end = start + pagination.value.pageSize;
    
    tableData.value = filteredData.slice(start, end);
    pagination.value.total = filteredData.length;
  } catch (error) {
    ElMessage.error('获取角色列表失败');
  } finally {
    tableLoading.value = false;
  }
}

async function handleSearch() {
  searchFormData.value = await searchApi.getValues();
  pagination.value.page = 1;
  fetchTableData();
}

function handleReset() {
  searchApi.resetForm();
  searchFormData.value = {
    name: '',
    code: '',
    status: '',
  };
  pagination.value.page = 1;
  fetchTableData();
}

function handleAdd() {
  roleApi.resetForm();
  roleModalApi.open();
}

function handleEdit(row: RoleItem) {
  roleApi.setValues(row);
  roleModalApi.open();
}

function handleDelete(row: RoleItem) {
  ElMessage.warning('删除功能待实现');
}

function handleStatusChange(row: RoleItem) {
  ElMessage.success(`角色状态已更新为：${row.status ? '启用' : '禁用'}`);
}

function handleAssignPermission(row: RoleItem) {
  permissionDrawerApi.open();
}

async function handleRoleSubmit(values: any) {
  ElMessage.success('角色保存成功');
  roleModalApi.close();
  fetchTableData();
}

function handlePageChange(page: number) {
  pagination.value.page = page;
  fetchTableData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.page = 1;
  fetchTableData();
}

fetchTableData();
</script>

<template>
  <Page title="角色管理">
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
            <ElButton type="primary" @click="handleAdd">新增角色</ElButton>
          </ElSpace>
        </div>
      </div>

      <ElTable
        v-loading="tableLoading"
        :data="tableData"
        stripe
        border
        @selection-change="(val: any) => selectedRowKeys = val.map((v: any) => v.id)"
      >
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn prop="name" label="角色名称" min-width="120" />
        <ElTableColumn prop="code" label="角色编码" min-width="120" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" min-width="180" />
        <ElTableColumn prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <ElTableColumn label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <ElSpace>
              <ElButton type="primary" link size="small" @click="handleAssignPermission(row)">分配权限</ElButton>
              <ElButton type="primary" link size="small" @click="handleEdit(row)">编辑</ElButton>
              <ElButton type="danger" link size="small" @click="handleDelete(row)">删除</ElButton>
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

      <div class="mt-4 flex items-center justify-end">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </ElCard>

    <RoleModal @confirm="handleRoleSubmit">
      <div class="p-4">
        <RoleForm />
      </div>
    </RoleModal>

    <PermissionDrawer>
      <div class="p-4">
        <div class="mb-4 text-sm text-gray-500">
          在此分配角色权限，选择后点击保存即可生效。
        </div>
        <el-tree
          :data="[
            {
              id: '1',
              label: '系统管理',
              children: [
                { id: '1-1', label: '用户管理' },
                { id: '1-2', label: '角色管理' },
                { id: '1-3', label: '权限管理' },
                { id: '1-4', label: '菜单管理' },
              ],
            },
            {
              id: '2',
              label: '业务功能',
              children: [
                { id: '2-1', label: '数据查询' },
                { id: '2-2', label: '数据导出' },
                { id: '2-3', label: '数据分析' },
              ],
            },
          ]"
          show-checkbox
          node-key="id"
          default-expand-all
        />
      </div>
      <template #footer>
        <ElSpace>
          <ElButton @click="permissionDrawerApi.close">取消</ElButton>
          <ElButton type="primary" @click="ElMessage.success('权限分配成功'); permissionDrawerApi.close()">保存</ElButton>
        </ElSpace>
      </template>
    </PermissionDrawer>
  </Page>
</template>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
