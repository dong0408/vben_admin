<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElTag,
} from 'element-plus';

const route = useRoute();
const router = useRouter();

// Retrieve task id if needed
// const taskId = route.query.id;

function goBack() {
  router.back();
}

function handleOperationLog() {
  console.log('查看操作日志');
}
</script>

<template>
  <Page title="任务详情">
    <template #extra>
      <ElButton @click="goBack">返回列表</ElButton>
      <ElButton type="primary" plain @click="handleOperationLog">
        操作日志
      </ElButton>
    </template>

    <ElCard shadow="never" class="mb-4">
      <template #header>
        <div class="font-bold">基本信息</div>
      </template>

      <ElDescriptions :column="4" class="mt-2" border>
        <ElDescriptionsItem label="任务来源：">人工创建</ElDescriptionsItem>
        <ElDescriptionsItem label="任务ID：">T001</ElDescriptionsItem>
        <ElDescriptionsItem label="任务名称：">XX公园冲扫</ElDescriptionsItem>
        <ElDescriptionsItem label="任务类型：">环卫·冲扫</ElDescriptionsItem>

        <ElDescriptionsItem label="任务执行次数：">2次</ElDescriptionsItem>
        <ElDescriptionsItem label="任务优先级：">
          <span class="font-bold text-red-500">高</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="任务状态：">
          <span class="font-bold text-red-500">告警</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="创建人：">操作人001</ElDescriptionsItem>

        <ElDescriptionsItem label="创建时间：">2026-03-01</ElDescriptionsItem>
        <ElDescriptionsItem label="完成时间：">2026-03-09</ElDescriptionsItem>
        <ElDescriptionsItem label="任务区域：">弋江区</ElDescriptionsItem>
        <ElDescriptionsItem label="派单方式：">人工派单</ElDescriptionsItem>

        <ElDescriptionsItem label="分配车辆：" :span="4">
          <div class="flex gap-2">
            <ElTag type="success" effect="plain" class="font-bold">D001</ElTag>
            <ElTag type="success" effect="plain" class="font-bold">D002</ElTag>
            <ElTag type="success" effect="plain" class="font-bold">D003</ElTag>
            <ElTag type="success" effect="plain" class="font-bold">D004</ElTag>
          </div>
        </ElDescriptionsItem>
      </ElDescriptions>

      <div class="mt-8">
        <div class="mb-4 text-base font-bold text-gray-800">路径概览：</div>
        <!-- 占位地图区域 -->
        <div
          class="relative flex h-[466px] w-full max-w-[1550px] items-center justify-center rounded border border-blue-100 bg-[#ecf5ff]"
        >
          <div class="text-blue-400">地图路径区域加载中...</div>

          <!-- 模拟起点 -->
          <div
            class="absolute left-10 top-10 flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 text-xs text-white"
          >
            起
          </div>
          <!-- 模拟终点 -->
          <div
            class="absolute bottom-10 right-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
          >
            终
          </div>
        </div>
      </div>
    </ElCard>
  </Page>
</template>
