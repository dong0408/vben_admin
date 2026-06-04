<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElRadioButton, ElRadioGroup } from 'element-plus';

import AlertList from './components/alert-list.vue';

type AlertTab = 'history' | 'realtime';

const activeTab = ref<AlertTab>('realtime');
</script>

<template>
  <Page auto-content-height>
    <div class="mb-3 flex items-center justify-between">
      <ElRadioGroup v-model="activeTab">
        <ElRadioButton value="realtime">实时预警</ElRadioButton>
        <ElRadioButton value="history">预警历史</ElRadioButton>
      </ElRadioGroup>
    </div>
    <AlertList v-if="activeTab === 'realtime'" mode="realtime" />
    <AlertList v-else mode="history" :refresh-interval="0" />
  </Page>
</template>
