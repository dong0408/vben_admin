<script setup lang="ts">
import { useRouter } from 'vue-router';

import { VbenButton } from '@vben/common-ui';

defineOptions({ name: 'ResetPasswordAdminForm' });

const router = useRouter();

function handleGoBack() {
  router.push('/auth/login'); // Adjust route as needed
}
</script>

<template>
  <div
    class="flex h-[549px] w-[450px] flex-col justify-start rounded-[20px] bg-[#F7F7F7] px-8 pb-10 pt-[32px] shadow-sm"
  >
    <!-- Header -->
    <div class="mb-8 w-[386px]">
      <h2 class="mb-3 text-[40px] font-bold text-[#303133]">管理员密码重置</h2>
      <p class="text-[16px] text-primary">
        管理员账号安全级别较高，无法自助重置密码。
      </p>
    </div>

    <!-- Content -->
    <div
      class="mb-8 w-[386px] text-[14px] font-bold leading-[22px] text-[#303133]"
    >
      <p>请按以下流程操作:</p>
      <p>1.联系超级管理员;</p>
      <p>2.或发邮件至:admin-suppor@company.com;</p>
      <p>3.提供您的:管理员账户名和注册时预留信息。</p>
      <br />
      <p>结果以短信形式发送到您的手机，请注意查收！</p>
    </div>

    <!-- Bottom Button -->
    <div class="mt-auto pl-2">
      <VbenButton
        class="h-10 w-full text-[18px] font-medium shadow-md transition-all active:scale-[0.98]"
        variant="default"
        @click="handleGoBack"
      >
        返回登录
      </VbenButton>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles if needed, mostly using Tailwind classes */
</style>
