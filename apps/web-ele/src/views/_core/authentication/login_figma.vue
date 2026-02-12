<script setup lang="ts">
import { computed, ref } from 'vue';

import IllustrationImg from '../../../assets/images/login-illustration.png';
import CodeLoginForm from './code-login-form.vue';
import ForgetPasswordWrapper from './forget-password-form.vue';
import LoginForm from './login-form.vue';
import RegisterForm from './register-form.vue';

defineOptions({ name: 'LoginFigma' });

// View State: 'login' | 'register' | 'forget' | 'code-login'
const currentView = ref<'code-login' | 'forget' | 'login' | 'register'>(
  'login',
);

const componentMap = {
  login: LoginForm,
  register: RegisterForm,
  forget: ForgetPasswordWrapper,
  'code-login': CodeLoginForm,
};

const currentComponent = computed(() => componentMap[currentView.value]);

function handleGoToRegister() {
  currentView.value = 'register';
}

function handleGoToForget() {
  currentView.value = 'forget';
}

function handleGoToCodeLogin() {
  currentView.value = 'code-login';
}

function handleBackToLogin() {
  currentView.value = 'login';
}
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-white">
    <div
      class="absolute left-5 top-4 z-20 flex items-center text-[30px] text-[#303133]"
    >
      <span class="font-[800]">奇瑞智科</span>
      <span class="mx-4 font-[500]">｜</span>
      <span class="font-[700]">无人驾驶远程调度系统</span>
    </div>
    <!-- Left Side: Illustration Panel -->
    <div
      class="relative hidden w-1/2 flex-col items-center justify-center lg:flex"
    >
      <!-- Decoration / Background Pattern could go here -->

      <div class="z-10 flex flex-col items-center">
        <!-- Illustration Image -->
        <img
          :src="IllustrationImg"
          alt="Login Illustration"
          class="w-full max-w-[600px] object-contain"
        />
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <!-- Right Section (Form) -->
    <div
      class="flex w-full flex-col items-center justify-center bg-white px-4 lg:w-1/2"
    >
      <Transition name="fade-slide" mode="out-in">
        <component
          :is="currentComponent"
          @register="handleGoToRegister"
          @forget-password="handleGoToForget"
          @code-login="handleGoToCodeLogin"
          @account-login="handleBackToLogin"
          @back="handleBackToLogin"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
