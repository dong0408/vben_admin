<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';

import { ElInput, ElMessage } from 'element-plus';

defineOptions({ name: 'ForgetPasswordForm' });

const emit = defineEmits(['back']);

const router = useRouter();

const form = reactive({
  mobile: '',
  code: '',
  password: '',
  confirmPassword: '',
});

const loading = ref(false);

async function handleReset() {
  if (!form.mobile || !form.code || !form.password || !form.confirmPassword) {
    return;
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }

  try {
    loading.value = true;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success('重置成功');
    // Navigate back to login
    // router.push('/auth/login'); // Or emit event
  } finally {
    loading.value = false;
  }
}

// Countdown Logic
const countDown = ref(0);
const sendCodeText = computed(() => {
  return countDown.value > 0 ? `${countDown.value}秒后重新获取` : '获取验证码';
});

let timer: NodeJS.Timeout | null = null;

async function handleSendCode() {
  if (countDown.value > 0 || !form.mobile) return;

  loading.value = true;
  // Simulate sending code
  setTimeout(() => {
    loading.value = false;
    countDown.value = 60;
    timer = setInterval(() => {
      countDown.value--;
      if (countDown.value <= 0 && timer) {
        clearInterval(timer);
      }
    }, 1000);
    form.code = '123456'; // Auto-fill for dev
  }, 1000);
}

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div
    class="flex h-[549px] w-[450px] flex-col justify-start rounded-[20px] bg-[#F7F7F7] px-8 pb-10 pt-[32px] shadow-sm"
  >
    <!-- Header -->
    <div class="mb-8 w-[386px]">
      <h2 class="mb-3 text-[40px] font-bold text-[#303133]">重置密码</h2>
      <p class="text-[16px] text-[#303133]">
        验证身份 → 输入验证码 → 设置新密码 → 设置成功
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleReset" class="space-y-6">
      <!-- Account (Mobile) -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-right text-sm font-medium text-[#303133]">账号</label>
        <ElInput
          v-model="form.mobile"
          placeholder="请输入手机号"
          class="!h-[40px] !w-[290px] text-base"
          size="large"
        />
      </div>

      <!-- Verification Code -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-right text-sm font-medium text-[#303133]">验证码</label>
        <div class="flex !w-[290px] gap-2">
          <ElInput
            v-model="form.code"
            placeholder="请输入"
            class="!h-[40px] flex-1 text-base"
            size="large"
          />
          <VbenButton
            class="!h-[40px] w-[100px]"
            variant="default"
            :disabled="countDown > 0 || !form.mobile"
            @click="handleSendCode"
          >
            {{ sendCodeText }}
          </VbenButton>
        </div>
      </div>

      <!-- New Password -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-right text-sm font-medium text-[#303133]">设置密码</label>
        <ElInput
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入"
          class="!h-[40px] !w-[290px] text-base"
          size="large"
        />
      </div>

      <!-- Confirm Password -->
      <div class="flex items-center justify-between">
        <label class="w-[70px] text-right text-sm font-medium text-[#303133]">确认密码</label>
        <ElInput
          v-model="form.confirmPassword"
          type="password"
          show-password
          placeholder="请输入"
          class="!h-[40px] !w-[290px] text-base"
          size="large"
        />
      </div>

      <!-- Submit Button -->
      <div class="pt-4">
        <VbenButton
          type="submit"
          class="h-10 w-full text-[18px] font-medium shadow-md transition-all active:scale-[0.98]"
          :loading="loading"
          variant="default"
        >
          重置
        </VbenButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Reuse styles from login-form for consistency */
:deep(.el-input__wrapper) {
  padding-left: 12px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

:deep(.el-input__inner) {
  height: 100%;
  color: #333;
}
</style>
