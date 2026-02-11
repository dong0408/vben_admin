<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '#/store';
import { VbenButton, VbenCheckbox, VbenInputPassword } from '@vben/common-ui';
import { ElInput } from 'element-plus';

defineOptions({ name: 'LoginCustom' });

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  username: '',
  password: '',
  rememberMe: false,
});

const loading = ref(false);

async function handleLogin() {
  if (!form.username || !form.password) {
    return;
  }
  
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
  <div class="flex h-screen w-full overflow-hidden bg-white">
    <!-- Left Side: Illustration -->
    <div class="relative hidden w-1/2 items-center justify-center bg-[#f0f2f5] lg:flex">
        <!-- Background decoration/image matching Figma -->
        <div class="flex flex-col items-center">
            <img 
                src="https://unpkg.com/@vben/static-source@0.1.7/source/login-box-bg.svg" 
                alt="Illustration"
                class="w-4/5 max-w-[600px]"
            />
            <div class="mt-8 text-2xl font-bold text-primary">
                无人驾驶远程调度系统
            </div>
            <div class="mt-2 text-gray-500">
                Driverless Remote Scheduling System
            </div>
        </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="flex w-full flex-col justify-center px-4 lg:w-1/2 lg:px-20 xl:px-32">
        <div class="mx-auto w-full max-w-[400px]">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900">欢迎登录 👋</h1>
                <p class="mt-2 text-gray-500">无人驾驶远程调度系统</p>
            </div>

            <!-- Login Tabs (Account / Mobile) -->
            <div class="mb-6 flex border-b border-gray-200">
                <button class="border-b-2 border-primary pb-2 text-primary font-medium">
                    账号登录
                </button>
                <button class="ml-6 pb-2 text-gray-500 hover:text-gray-700">
                    验证码登录
                </button>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-6">
                <!-- Username -->
                <div class="space-y-2">
                    <ElInput 
                        v-model="form.username"
                        placeholder="请输入账号"
                        class="h-12"
                        size="large"
                    >
                        <template #prefix>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </template>
                    </ElInput>
                </div>

                <!-- Password -->
                <div class="space-y-2">
                    <VbenInputPassword
                        v-model="form.password"
                        placeholder="请输入密码"
                        class="h-12"
                    >
                        <template #prefix>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </template>
                    </VbenInputPassword>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-between text-sm">
                    <VbenCheckbox v-model="form.rememberMe">
                        记住密码
                    </VbenCheckbox>
                    <a href="javascript:void(0)" class="text-primary hover:underline" @click="handleGo('/auth/forget-password')">
                        重置密码
                    </a>
                </div>

                <!-- Submit Button -->
                <VbenButton 
                    type="submit" 
                    class="w-full h-12 text-base" 
                    :loading="loading"
                    variant="default"
                >
                    登录
                </VbenButton>

                <!-- Footer -->
                <div class="text-center text-sm text-gray-500">
                    <span class="mr-2">还没有账号?</span>
                    <a href="javascript:void(0)" class="text-primary hover:underline" @click="handleGo('/auth/register')">
                        申请注册
                    </a>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure full height container */
:deep(.vben-input) {
    @apply border-gray-200 bg-gray-50;
}
</style>
