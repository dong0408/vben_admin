<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { VbenButton, VbenCheckbox } from '@vben/common-ui';

import { ElInput } from 'element-plus';

import { useAuthStore } from '#/store';

import HelloImg from '../../../assets/images/hello.png';

defineOptions({ name: 'LoginForm' });

const emit = defineEmits(['register', 'forget-password', 'code-login']);

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  username: '',
  password: '',
  rememberMe: false,
});

const loading = ref(false);

async function handleLogin() {
  if (!form.username || !form.password) return;

  try {
    loading.value = true;
    await authStore.authLogin({
      username: form.username,
      password: form.password,
    });
  } finally {
    loading.value = false;
  }
}

function handleGo(path: string) {
  router.push(path);
}
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
    <form @submit.prevent="handleLogin" class="space-y-8">
      <!-- Username -->
      <div class="flex items-center justify-between">
        <label class="w-10 text-sm font-medium text-gray-700">账号</label>
        <ElInput
          v-model="form.username"
          placeholder="请输入账号"
          class="!h-[40px] !w-[346px] text-base"
          size="large"
        />
      </div>

      <!-- Password -->
      <div class="flex items-center justify-between">
        <label class="w-10 text-sm font-medium text-gray-700">密码</label>
        <ElInput
          v-model="form.password"
          type="password"
          show-password
          placeholder="请输入密码"
          class="!h-[40px] !w-[346px] text-base shadow-sm"
          size="large"
        />
      </div>

      <!-- Remember & Forgot -->
      <div class="my-8 flex items-center justify-between pl-2">
        <VbenCheckbox v-model="form.rememberMe" class="text-sm text-gray-600">
          记住密码
        </VbenCheckbox>
        <a
          href="javascript:void(0)"
          class="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          @click="$emit('forget-password')"
        >
          重置密码
        </a>
      </div>

      <!-- Submit -->
      <div class="pl-2">
        <VbenButton
          type="submit"
          class="h-10 w-[386px] text-base font-semibold shadow-md transition-all active:scale-[0.98]"
          :loading="loading"
          variant="default"
        >
          登录
        </VbenButton>
      </div>

      <!-- Switch to Code Login -->
      <div class="text-center">
        <VbenButton
          type="button"
          variant="link"
          class="text-sm font-medium text-primary hover:underline"
          @click="$emit('code-login')"
        >
          验证码登录 >
        </VbenButton>
      </div>

      <!-- Footer -->
      <div class="mt-8 text-center">
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
/* Customize Element Plus Input to match cleaner look if needed */
:deep(.el-input__wrapper) {
  padding-left: 12px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px; /* User requested radius: 4px */
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary);
}

:deep(.el-input__inner) {
  height: 100%;
  color: #333; /* User requested text color */
}
</style>
