<script lang="ts" setup>
import { nextTick, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElMessage,
  ElPopconfirm,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleListApi,
  updateRoleApi,
} from '#/api';

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  status: number;
  createdAt: string;
}

const loading = ref(false);
const tableData = ref<Role[]>([]);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  handleSubmit: async (values) => {
    const isEdit = !!editingId.value;
    const api = isEdit ? updateRoleApi : createRoleApi;
    const url = isEdit ? editingId.value : '';

    await api(url, values);
    ElMessage.success(isEdit ? '更新成功' : '创建成功');
    dialogVisible.value = false;
    loadRoles();
  },
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
      component: 'Input',
      fieldName: 'description',
      label: '描述',
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
  ],
});

const dialogVisible = ref(false);
const editingId = ref('');
const dialogTitle = ref('新增角色');

const [PermissionModal, permissionModalApi] = useVbenModal();
const currentRoleId = ref('');

function openDialog(role?: Role) {
  dialogVisible.value = true;
  editingId.value = role?.id || '';
  dialogTitle.value = role ? '编辑角色' : '新增角色';
  if (role) {
    formApi.setValues(role);
  } else {
    formApi.resetForm();
  }
}

function closeDialog() {
  dialogVisible.value = false;
  editingId.value = '';
  formApi.resetForm();
}

async function loadRoles() {
  loading.value = true;
  try {
    const response = await getRoleListApi();
    console.log('API 返回数据:', response); // 添加日志
    tableData.value = response.data || mockRoles;
  } catch (error) {
    console.error('加载角色数据出错:', error); // 错误日志
    tableData.value = mockRoles;
  } finally {
    loading.value = false;
    await nextTick(); // 确保 DOM 已更新
  }
  tableData.value = mockRoles;
}

const mockRoles: Role[] = [
  {
    id: '1',
    name: '超级管理员',
    code: 'SUPER_ADMIN',
    description: '系统最高权限，拥有所有功能的访问权限',
    status: 1,
    createdAt: '2024-01-15 09:30:00',
  },
  {
    id: '2',
    name: '系统管理员',
    code: 'ADMIN',
    description: '系统管理权限，可管理用户、角色、菜单等',
    status: 1,
    createdAt: '2024-02-20 14:25:00',
  },
  {
    id: '3',
    name: '普通用户',
    code: 'USER',
    description: '普通用户权限，可访问基础功能',
    status: 1,
    createdAt: '2024-03-10 11:45:00',
  },
  {
    id: '4',
    name: '访客',
    code: 'GUEST',
    description: '访客权限，仅可查看公开内容',
    status: 1,
    createdAt: '2024-04-05 16:20:00',
  },
  {
    id: '5',
    name: '审核员',
    code: 'REVIEWER',
    description: '审核权限，可对提交的内容进行审核',
    status: 1,
    createdAt: '2024-05-12 10:15:00',
  },
  {
    id: '6',
    name: '开发者',
    code: 'DEVELOPER',
    description: '开发者权限，可访问开发相关功能和文档',
    status: 1,
    createdAt: '2024-06-08 13:40:00',
  },
  {
    id: '7',
    name: '财务专员',
    code: 'FINANCE',
    description: '财务权限，可处理财务相关业务',
    status: 1,
    createdAt: '2024-07-22 15:55:00',
  },
  {
    id: '8',
    name: '测试角色',
    code: 'TEST_ROLE',
    description: '测试用角色，暂时禁用',
    status: 0,
    createdAt: '2024-08-30 08:50:00',
  },
];
tableData.value = mockRoles;
async function handleDelete(id: string) {
  await deleteRoleApi(id);
  ElMessage.success('删除成功');
  loadRoles();
}

function openPermissionModal(id: string) {
  currentRoleId.value = id;
  permissionModalApi.open();
}

loadRoles();
</script>

<template>
  <Page title="角色管理">
    <!-- <el-table :data=tableData >

    </el-table> -->
    <ElCard>
      <template #header>
        <div class="flex items-center justify-between">
          <span>角色列表</span>
          <ElButton type="primary" @click="openDialog()"> 新增角色 </ElButton>
        </div>
      </template>

      <ElTable
        :data="tableData"
        stripe
        :key="tableData.length"
        style="width: 100%"
      >
        <ElTableColumn label="ID" prop="id" width="80" />
        <ElTableColumn label="角色名称" prop="name" width="150" />
        <ElTableColumn label="角色编码" prop="code" width="150" />
        <ElTableColumn label="描述" prop="description" show-overflow-tooltip />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="创建时间" prop="createdAt" width="180" />
        <ElTableColumn label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <ElButton type="primary" link @click="openDialog(row)">
              编辑
            </ElButton>
            <ElButton type="warning" link @click="openPermissionModal(row.id)">
              权限分配
            </ElButton>
            <ElPopconfirm
              title="确定删除该角色吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <ElButton type="danger" link>删除</ElButton>
              </template>
            </ElPopconfirm>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <ElDialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <Form />
      <template #footer>
        <div class="flex justify-end gap-3">
          <ElButton @click="closeDialog">取消</ElButton>
          <ElButton type="primary" @click="formApi.submitForm">确定</ElButton>
        </div>
      </template>
    </ElDialog>

    <PermissionModal title="权限分配" :footer="false" class="w-[800px]">
      <RolePermission :role-id="currentRoleId" />
    </PermissionModal>
  </Page>
</template>
