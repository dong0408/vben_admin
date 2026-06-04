<script lang="ts" setup>
import type { AlertApi } from '#/api/alert';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { categoryLabelMap, priorityLabelMap } from '../data';

const detail = ref<Partial<AlertApi.AlertItem>>({});

const [Drawer, drawerApi] = useVbenDrawer({
  closable: true,
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<Partial<AlertApi.AlertItem>>();
      detail.value = data || {};
    } else {
      detail.value = {};
    }
  },
});

const items = [
  { label: '车辆编码', key: 'vehicleCode' as const },
  { label: '预警类型', key: 'category' as const },
  { label: '优先级', key: 'priority' as const },
  { label: '预警时间', key: 'alertTime' as const },
  { label: '故障码', key: 'faultCode' as const },
  { label: '故障描述', key: 'faultDescription' as const },
];

function formatValue(key: keyof AlertApi.AlertItem) {
  const raw = detail.value?.[key];
  if (raw === undefined || raw === null || raw === '') return '-';
  if (key === 'category') return categoryLabelMap[String(raw)] || String(raw);
  if (key === 'priority') return priorityLabelMap[String(raw)] || String(raw);
  return String(raw);
}
</script>

<template>
  <Drawer title="预警详情" class="w-[480px]">
    <div class="alert-detail">
      <div v-for="item in items" :key="item.key" class="alert-detail__item">
        <span class="alert-detail__label">{{ item.label }}：</span>
        <span class="alert-detail__value">{{ formatValue(item.key) }}</span>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.alert-detail {
  padding: 4px 0;
}

.alert-detail__item {
  display: block;
  padding: 10px 0;
  font-size: 14px;
  line-height: 1.6;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.alert-detail__item:last-child {
  border-bottom: none;
}

.alert-detail__label {
  display: inline-block;
  min-width: 80px;
  color: var(--el-text-color-secondary);
}

.alert-detail__value {
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>
