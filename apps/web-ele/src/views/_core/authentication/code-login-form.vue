<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import { ElInput, ElMessage } from 'element-plus';

import { useAuthStore } from '#/store';

import HelloImg from '../../../assets/images/hello.png';

defineOptions({ name: 'CodeLoginForm' });

const emit = defineEmits(['register', 'account-login']);

const authStore = useAuthStore();

const form = reactive({
  mobile: '',
  code: '',
});

const loading = ref(false);

async function handleLogin() {
  if (!form.mobile || !form.code) {
    ElMessage.warning('请输入手机号和验证码');
    return;
  }

  try {
    loading.value = true;
    // Map mobile/code to username/password for the universal mock auth
    const loginParams = { username: form.mobile, password: form.code };
    await authStore.authLogin(loginParams);
  } finally {
    loading.value = false;
  }
}

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
      <h2 class="flex h-[78px] items-center text-3xl font-bold text-gray-900">
        欢迎登录
        <img
          :src="HelloImg"
          alt="Hello"
          class="ml-3 h-[78px] w-[105px] object-contain"
        />
      </h2>
      <p class="text-[16px] font-[400] text-gray-500">
        欢迎您的到来，祝您有美好的一天！
      </p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleLogin" class="space-y-10">
      <!-- Mobile -->
      <div class="flex items-center justify-between">
        <label class="w-10 text-sm font-medium text-gray-700">手机</label>
        <ElInput
          v-model="form.mobile"
          placeholder="请输入手机号"
          class="!h-[40px] !w-[346px] text-base"
          size="large"
        />
      </div>

      <!-- Verification Code -->
      <div class="flex items-center justify-between">
        <label class="w-10 text-sm font-medium text-gray-700">验证码</label>
        <div class="flex !w-[346px] gap-2">
          <ElInput
            v-model="form.code"
            placeholder="验证码"
            class="!h-[40px] flex-1 text-base"
            size="large"
          />
          <VbenButton
            class="!h-[40px] w-[110px]"
            variant="default"
            :disabled="countDown > 0 || !form.mobile"
            @click="handleSendCode"
          >
            {{ sendCodeText }}
          </VbenButton>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="pl-2 pt-8">
        <VbenButton
          type="submit"
          class="h-10 w-[386px] text-base font-semibold shadow-md transition-all active:scale-[0.98]"
          :loading="loading"
          variant="default"
        >
          登录
        </VbenButton>
      </div>

      <!-- Switch to Account Login -->
      <div class="text-center">
        <VbenButton
          type="button"
          variant="link"
          class="text-sm font-medium text-primary hover:underline"
          @click="$emit('account-login')"
        >
          账号登录 >
        </VbenButton>
      </div>

      <!-- Footer (Register) -->
      <div class="mt-4 text-center">
        <span class="text-sm text-gray-500">还没有账号?</span>
        <a
          href="javascript:void(0)"
          class="ml-2 text-sm font-medium text-primary hover:underline"
          @click="$emit('register')"
        >
          申请注册
        </a>
      </div>
    </form>
  </div>
</template>

<style scoped>
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
