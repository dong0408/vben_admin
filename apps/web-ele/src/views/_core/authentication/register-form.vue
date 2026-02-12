<script setup lang="ts">
import { reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { ElInput, ElMessage } from 'element-plus';

defineOptions({ name: 'RegisterForm' });

const emit = defineEmits(['back']);

const form = reactive({
  companyId: '',
  name: '',
  mobile: '',
  email: '',
  reason: '',
});

const loading = ref(false);

async function handleRegister() {
  // Basic validation
  if (!form.companyId || !form.name || !form.mobile) {
    ElMessage.warning('请填写必要信息');
    return;
  }

  try {
    loading.value = true;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    ElMessage.success('申请注册提交成功');
    emit('back'); // Navigate back to login
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="flex w-[450px] flex-col justify-start rounded-[20px] bg-[#F7F7F7] px-8 pb-10 pt-[32px] shadow-sm"
  >
    <!-- Header -->
    <div class="mb-4 w-[386px]">
      <h2 class="mb-3 text-[40px] font-bold text-[#303133]">申请注册</h2>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Company ID -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-left text-sm font-medium text-[#303133]"
          >公司ID</label
        >
        <ElInput
          v-model="form.companyId"
          placeholder="请输入"
          class="!h-[40px] !w-[290px] text-base"
          size="large"
        />
      </div>

      <!-- Name -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-left text-sm font-medium text-[#303133]"
          >姓名</label
        >
        <ElInput
          v-model="form.name"
          placeholder="请输入"
          class="!h-[40px] !w-[290px] text-base"
          size="large"
        />
      </div>

      <!-- Mobile -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-left text-sm font-medium text-[#303133]"
          >账号</label
        >
        <ElInput
          v-model="form.mobile"
          placeholder="请输入手机号"
          class="!h-[40px] !w-[290px] text-base"
          size="large"
        />
      </div>

      <!-- Reason (Textarea) -->
      <div class="flex items-start justify-between">
        <label
          class="mt-2 w-[70px] text-left text-sm font-medium text-[#303133]"
          >申请原因</label
        >
        <ElInput
          v-model="form.reason"
          type="textarea"
          :rows="2"
          placeholder="请输入"
          class="!w-[290px] text-base"
        />
      </div>

      <!-- divider -->
      <div class="my-2 h-[1px] w-full bg-black/10"></div>
      <p class="text-xs font-bold text-[#303133]">
        结果以短信形式发送到您的手机，请注意查收！
      </p>

      <!-- Return to Login Link -->
      <div class="flex items-center justify-end">
        <a
          href="javascript:void(0)"
          class="text-sm font-medium text-primary hover:underline"
          @click="$emit('back')"
        >
          返回登录
        </a>
      </div>

      <!-- Submit Button -->
      <div class="my-8">
        <VbenButton
          type="submit"
          class="h-10 w-full text-[18px] font-medium shadow-md transition-all active:scale-[0.98]"
          :loading="loading"
          variant="default"
        >
          申请注册
        </VbenButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  background-color: #fff;
  border: 1px solid #fff;
  box-shadow: none;
}

:deep(.el-textarea__inner) {
  padding: 8px 12px;
  background-color: #fff;
  border: 1px solid #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
}

:deep(.el-textarea__inner:focus),
:deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}
</style>
