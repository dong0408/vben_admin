<script lang="ts" setup>
import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElMessage,
  ElPopconfirm,
  ElSpace,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';

interface UserItem {
  id: string;
  username: string;
  nickname: string;
  role: string;
  status: number;
  createTime: string;
  email: string;
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
      fieldName: 'username',
      label: '用户名',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '昵称',
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

const [UserForm, userApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'nickname',
      label: '昵称',
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: '邮箱',
      rules: 'required',
    },
    {
      component: 'Select',
      fieldName: 'role',
      label: '角色',
      rules: 'required',
      componentProps: {
        options: [
          { value: '超级管理员', label: '超级管理员' },
          { value: '普通用户', label: '普通用户' },
          { value: '访客', label: '访客' },
        ],
      },
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

const [UserModal, userModalApi] = useVbenModal({
  fullscreenButton: false,
  title: '用户信息',
  draggable: true,
  onConfirm: handleUserSubmit,
});

const tableLoading = ref(false);
const tableData = ref<UserItem[]>([]);
const selectedRowKeys = ref<string[]>([]);
const editId = ref<null | string>(null);

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
});

const searchFormData = ref({
  username: '',
  nickname: '',
  status: '',
});

const mockUsers: UserItem[] = [
  {
    id: '1',
    username: 'admin',
    nickname: '管理员',
    role: '超级管理员',
    status: 1,
    createTime: '2024-01-01 10:00:00',
    email: 'admin@example.com',
  },
  {
    id: '2',
    username: 'test',
    nickname: '测试用户',
    role: '普通用户',
    status: 1,
    createTime: '2024-01-02 11:00:00',
    email: 'test@example.com',
  },
  {
    id: '3',
    username: 'guest',
    nickname: '访客用户',
    role: '访客',
    status: 0,
    createTime: '2024-01-03 12:00:00',
    email: 'guest@example.com',
  },
];

async function fetchTableData() {
  tableLoading.value = true;
  try {
    const { username, nickname, status } = searchFormData.value;
    let filteredData = [...mockUsers];

    if (username) {
      filteredData = filteredData.filter((item) =>
        item.username.includes(username),
      );
    }
    if (nickname) {
      filteredData = filteredData.filter((item) =>
        item.nickname.includes(nickname),
      );
    }
    if (status !== '') {
      filteredData = filteredData.filter(
        (item) => item.status === Number.parseInt(status),
      );
    }

    const start = (pagination.value.page - 1) * pagination.value.pageSize;
    const end = start + pagination.value.pageSize;

    tableData.value = filteredData.slice(start, end);
    pagination.value.total = filteredData.length;
  } catch {
    ElMessage.error('获取用户列表失败');
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
    username: '',
    nickname: '',
    status: '',
  };
  pagination.value.page = 1;
  fetchTableData();
}

function handleAdd() {
  editId.value = null;
  userApi.resetForm();
  userModalApi.open();
  userModalApi.setState({ title: '新增用户' });
}

function handleEdit(row: UserItem) {
  editId.value = row.id;

  // Set values needs to match schema field names
  userApi.setValues({
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    role: row.role,
    status: row.status,
  });

  userModalApi.open();
  userModalApi.setState({ title: '编辑用户' });
}

function handleDelete(row: UserItem) {
  ElMessage.success(`删除用户 ${row.username} 成功`);
  fetchTableData();
}

function handleStatusChange(row: UserItem) {
  ElMessage.success(`用户状态已更新为：${row.status ? '启用' : '禁用'}`);
}

async function handleUserSubmit() {
  const { valid } = await userApi.validate();
  if (!valid) return;

  const values = await userApi.getValues();
  console.log('Submit values:', values, 'Edit ID:', editId.value);

  ElMessage.success(editId.value ? '用户更新成功' : '用户创建成功');
  userModalApi.close();
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
  <Page title="用户管理">
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
            <ElButton type="primary" @click="handleAdd">新增用户</ElButton>
          </ElSpace>
        </div>
      </div>

      <ElTable
        v-loading="tableLoading"
        :data="tableData"
        stripe
        border
        @selection-change="
          (val: any) => (selectedRowKeys = val.map((v: any) => v.id))
        "
      >
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn prop="username" label="用户名" min-width="120" />
        <ElTableColumn prop="nickname" label="昵称" min-width="120" />
        <ElTableColumn prop="role" label="角色" min-width="120">
          <template #default="{ row }">
            <ElTag>{{ row.role }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="email" label="邮箱" min-width="150" />
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="createTime" label="创建时间" min-width="180" />
        <ElTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ElSpace>
              <ElButton
                type="primary"
                link
                size="small"
                @click="handleEdit(row)"
              >
                编辑
              </ElButton>
              <ElPopconfirm
                title="确认删除该用户吗?"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <ElButton type="danger" link size="small"> 删除 </ElButton>
                </template>
              </ElPopconfirm>

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

    <UserModal>
      <div class="p-4">
        <UserForm />
      </div>
    </UserModal>
  </Page>
</template>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 0;
}
</style>
