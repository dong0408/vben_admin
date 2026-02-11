```
<script setup lang="ts">
import { computed, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAuthStore } from '#/store';
import { VbenButton, VbenCheckbox } from '@vben/common-ui';
import { ElInput } from 'element-plus';

import HelloImg from '../../../assets/images/hello.png';
import IllustrationImg from '../../../assets/images/login-illustration.png';

defineOptions({ name: 'LoginFigma' });

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  username: '',
  password: '',
  mobile: '',
  code: '',
  rememberMe: false,
});

const loading = ref(false);
const loginType = ref('account');

async function handleLogin() {
  // Basic validation based on type
  if (loginType.value === 'account') {
     if (!form.username || !form.password) return;
  } else {
     if (!form.mobile || !form.code) return;
  }

  try {
    loading.value = true;
    
    // Map mobile/code to username/password for the universal mock auth
    const loginParams = loginType.value === 'account' 
      ? { username: form.username, password: form.password }
      : { username: form.mobile, password: form.code };

    await authStore.authLogin(loginParams);
  } finally {
    loading.value = false;
  }
}

function handleGo(path: string) {
  router.push(path);
}

const countDown = ref(0);
const sendCodeText = computed(() => {
    return countDown.value > 0 ? `${countDown.value}秒后重新获取` : '获取验证码';
});

let timer: NodeJS.Timeout | null = null;

async function handleSendCode() {
    if (countDown.value > 0 || !form.mobile) return;
    
    // Simulate sending code
    loading.value = true;
    setTimeout(() => {
        loading.value = false;
        countDown.value = 60;
        timer = setInterval(() => {
            countDown.value--;
            if (countDown.value <= 0 && timer) {
                clearInterval(timer);
            }
        }, 1000);
        
        // Auto-fill code for convenience in dev/mock environment
        form.code = '123456'; 
    }, 1000);
}

onUnmounted(() => {
    if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-white">
    <div class="absolute left-5 top-4 z-20 flex items-center text-[30px] text-[#303133]">
      <span class="font-[800]">奇瑞智科</span>
      <span class="mx-4 font-[500]">｜</span>
      <span class="font-[700]">无人驾驶远程调度系统</span>
    </div>
    <!-- Left Side: Illustration Panel -->
    <div class="relative hidden w-1/2 flex-col items-center justify-center  lg:flex">
        <!-- Decoration / Background Pattern could go here -->
        
        <div class="flex flex-col items-center z-10">
            <!-- Illustration Image -->
            <img 
                :src="IllustrationImg" 
                alt="Login Illustration" 
                class="w-full max-w-[600px] object-contain"
            />
        </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="flex w-full flex-col items-center justify-center bg-white px-4 lg:w-1/2">
        <div class="flex h-[549px] w-[450px] flex-col justify-start rounded-[20px] bg-[#F7F7F7] px-8 pt-[32px] pb-10 shadow-sm">
            <!-- Header -->
            <div class="mb-8 w-[386px]">
                <h2 class="flex items-center text-3xl font-bold text-gray-900 h-[78px]">
                    欢迎登录 
                    <img :src="HelloImg" alt="Hello" class="ml-3 h-[78px] w-[105px] object-contain" />
                </h2>
                <p class="text-[16px] font-[400] text-gray-500">欢迎您的到来，祝您有美好的一天！</p>
            </div>
            
            <!-- Form -->
            <form @submit.prevent="handleLogin" class="space-y-10">
                <template v-if="loginType === 'account'">
                    <!-- Username -->
                    <div class="flex items-center justify-between">
                        <label class="w-10 text-sm font-medium text-gray-700">账号</label>
                        <ElInput 
                            v-model="form.username"
                            placeholder="请输入账号"
                            class="!w-[346px] !h-[40px] text-base"
                            size="large"
                        >
                            <!-- <template #prefix>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </template> -->
                        </ElInput>
                    </div>

                    <!-- Password -->
                    <div class="flex items-center justify-between">
                        <label class="w-10 text-sm font-medium text-gray-700">密码</label>
                        <ElInput
                            v-model="form.password"
                            type="password"
                            show-password
                            placeholder="请输入密码"
                            class="!w-[346px] !h-[40px] text-base shadow-sm"
                            size="large"
                        >
                            <!-- <template #prefix>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </template> -->
                        </ElInput>
                    </div>
                </template>
                
                <template v-if="loginType === 'mobile'">
                     <!-- Mobile Input placeholder to maintain layout -->
                    <div class="flex items-center justify-between">
                        <label class="w-10 text-sm font-medium text-gray-700">手机</label>
                        <ElInput 
                            v-model="form.mobile"
                            placeholder="请输入手机号"
                            class="!w-[346px] !h-[40px] text-base"
                            size="large"
                        >
                             <!-- <template #prefix>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                            </template> -->
                        </ElInput>
                    </div>
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
                </template>

                <!-- Remember & Forgot -->
                <div class="flex items-center justify-between pl-2 my-8">
                    <VbenCheckbox v-model="form.rememberMe" class="text-sm text-gray-600">
                        记住密码
                    </VbenCheckbox>
                    <a href="javascript:void(0)" class="text-sm font-medium text-primary hover:text-primary/80 transition-colors" @click="handleGo('/auth/forget-password')">
                        重置密码
                    </a>
                </div>

                <!-- Submit -->
                <div class="pl-2">
                    <VbenButton 
                        type="submit" 
                        class="w-[386px] h-10 text-base font-semibold shadow-md active:scale-[0.98] transition-all" 
                        :loading="loading"
                        variant="default"
                    >
                        登录
                    </VbenButton>
                </div>
            <!-- Login Tabs (Buttons) -->
            <!-- <div class="mb-8 flex pl-2 flex justify-center">
                <button 
                    class="mr-6 text-[18px] transition-all"
                    :class="loginType === 'account' ? 'font-bold text-[#303133]' : 'font-normal text-gray-400'"
                    @click="loginType = 'account'"
                >
                    账号登录
                </button>
                <button 
                    class="text-[18px] transition-all"
                    :class="loginType === 'mobile' ? 'font-bold text-[#303133]' : 'font-normal text-gray-400'"
                    @click="loginType = 'mobile'"
                >
                    验证码登录
                </button>
            </div> -->

                <!-- Footer -->
                <div class="mt-8 text-center">
                    <span class="text-sm text-gray-500">还没有账号?</span>
                    <a href="javascript:void(0)" class="ml-2 text-sm font-medium text-primary hover:underline" @click="handleGo('/auth/register')">
                        申请注册
                    </a>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* Customize Element Plus Input to match cleaner look if needed */
:deep(.el-input__wrapper) {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 4px; /* User requested radius: 4px */
    padding-left: 12px;
}
:deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary);
    border-color: var(--el-color-primary);
}
:deep(.el-input__inner) {
    height: 100%;
    color: #333; /* User requested text color */
}
</style>
```
