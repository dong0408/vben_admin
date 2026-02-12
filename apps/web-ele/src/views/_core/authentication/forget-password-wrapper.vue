<script setup lang="ts">
import { ref } from 'vue';

import { VbenButton } from '@vben/common-ui';

import ForgetPasswordForm from './forget-password-form.vue';
import ResetPasswordAdminForm from './reset-password-admin-form.vue';

defineOptions({ name: 'ForgetPasswordWrapper' });

const emit = defineEmits(['back']);

const activeTab = ref<'admin' | 'user'>('user');
</script>

<template>
  <div class="relative">
    <!-- Tab Switcher -->
    <div class="absolute right-0 top-[-40px] flex gap-4">
      <button
        class="text-lg font-medium transition-colors"
        :class="
          activeTab === 'user' ? 'font-bold text-primary' : 'text-gray-500'
        "
        @click="activeTab = 'user'"
      >
        用户找回
      </button>
      <button
        class="text-lg font-medium transition-colors"
        :class="
          activeTab === 'admin' ? 'font-bold text-primary' : 'text-gray-500'
        "
        @click="activeTab = 'admin'"
      >
        管理员找回
      </button>
    </div>

    <!-- Forms -->
    <div v-if="activeTab === 'user'">
      <ForgetPasswordForm @back="$emit('back')" />
    </div>
    <div v-else>
      <ResetPasswordAdminForm @back="$emit('back')" />
    </div>

    <!-- Back Button (Global for wrapper) -->
    <div class="absolute bottom-4 right-8">
      <VbenButton
        type="button"
        variant="link"
        class="text-gray-500 hover:text-primary"
        @click="$emit('back')"
      >
        返回登录
      </VbenButton>
    </div>
  </div>
</template>
