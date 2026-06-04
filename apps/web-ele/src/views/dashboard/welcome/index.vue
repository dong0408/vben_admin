<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { ElButton } from 'element-plus';

import WelcomeIllustration from '../../../assets/images/welcome-illustration.png';

const router = useRouter();

const goDashboard = () => {
  router.push('/dashboard/workspace');
};
</script>

<template>
  <div
    class="dark:bg-dark-800 m-4 flex h-full flex-col overflow-hidden rounded-xl bg-white md:flex-row"
  >
    <!-- Left Content Section -->
    <div class="flex max-w-2xl flex-1 flex-col justify-center p-10 md:p-14">
      <!-- Badge -->
      <div
        class="mb-6 inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      >
        <span
          class="mr-2 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
        ></span>
        开始准备工作
      </div>

      <!-- Heading -->
      <h1
        class="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white"
      >
        你好，欢迎登录！
      </h1>

      <!-- Subtitle -->
      <p class="mb-10 text-xl leading-relaxed text-gray-500 dark:text-gray-400">
        你的专属管理控制台已准备就绪，<br />
        准备好一键掌控全场了吗？
      </p>

      <!-- Action Buttons -->
      <div class="flex gap-4">
        <ElButton
          type="primary"
          size="large"
          @click="goDashboard"
          class="!h-12 !rounded-lg !px-8 !text-base font-medium shadow-sm transition-transform hover:scale-105"
        >
          开始一键掌控
        </ElButton>
      </div>
    </div>

    <!-- Right Image Section -->
    <div
      class="dark:from-dark-800 dark:to-dark-700 dark:border-dark-700 relative flex flex-1 items-center justify-center overflow-hidden border-l border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-8"
    >
      <div
        class="absolute inset-0 flex items-center justify-center bg-blue-500 opacity-[0.03] mix-blend-multiply dark:bg-blue-400 dark:opacity-10"
      >
        <!-- Decorative circle -->
        <div
          class="absolute h-[600px] w-[600px] -translate-x-1/4 -translate-y-1/4 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-800/10"
        ></div>
      </div>
      <img
        :src="WelcomeIllustration"
        alt="Welcome Illustration"
        class="hero-image relative z-10 w-full max-w-lg drop-shadow-2xl filter lg:max-w-xl"
      />
    </div>
  </div>
</template>

<style scoped>
.hero-image {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.02);
  }
  100% {
    transform: translateY(0px) scale(1);
  }
}
</style>
