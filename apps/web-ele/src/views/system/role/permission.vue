<script lang="ts" setup>
import type { CheckboxValueType } from 'element-plus';

import { computed, ref, watch } from 'vue';

import { ElButton, ElCard, ElCheckbox, ElMessage, ElTree } from 'element-plus';

import {
  assignPermissionsApi,
  getPermissionListApi,
  getRolePermissionsApi,
} from '#/api';

interface Props {
  roleId: string;
}

const props = defineProps<Props>();

const loading = ref(false);
const treeData = ref<any[]>([]);
const checkedKeys = ref<string[]>([]);
const treeRef = ref();

const allPermissionIds = computed(() => {
  const ids: string[] = [];
  const traverse = (nodes: any[]) => {
    nodes.forEach((node) => {
      ids.push(node.id);
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  traverse(treeData.value);
  return ids;
});

async function loadPermissions() {
  if (!props.roleId) return;

  loading.value = true;
  try {
    const [permissions, rolePermissions] = await Promise.all([
      getPermissionListApi(),
      getRolePermissionsApi(props.roleId),
    ]);
    treeData.value = permissions || [];
    checkedKeys.value = rolePermissions || [];
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  await assignPermissionsApi(props.roleId, checkedKeys.value);
  ElMessage.success('权限分配成功');
}

function handleCheckAllChange(checked: CheckboxValueType) {
  const isChecked = !!checked;
  checkedKeys.value = isChecked ? allPermissionIds.value : [];
  treeRef.value.setCheckedKeys(checkedKeys.value);
}

function handleCheck(_data: any, checkedInfo: any) {
  checkedKeys.value = (checkedInfo.checkedKeys || []).map(String);
}

watch(() => props.roleId, loadPermissions, { immediate: true });
</script>

<template>
  <ElCard>
    <template #header>
      <div class="flex items-center justify-between">
        <span>权限列表</span>
        <div class="flex items-center gap-3">
          <ElCheckbox
            :model-value="
              checkedKeys.length === allPermissionIds.length &&
              allPermissionIds.length > 0
            "
            :indeterminate="
              checkedKeys.length > 0 &&
              checkedKeys.length < allPermissionIds.length
            "
            @change="handleCheckAllChange"
          >
            全选
          </ElCheckbox>
          <ElButton type="primary" @click="handleSave" :loading="loading">
            保存
          </ElButton>
        </div>
      </div>
    </template>

    <ElTree
      ref="treeRef"
      :data="treeData"
      :props="{ label: 'name', children: 'children' }"
      node-key="id"
      show-checkbox
      default-expand-all
      :default-checked-keys="checkedKeys"
      @check="handleCheck"
      v-loading="loading"
    />
  </ElCard>
</template>
