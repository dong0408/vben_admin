<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer, useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { ElInput, ElOption, ElSelect } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createUserApi, updateUserApi } from '#/api/system/user';
import { $t } from '#/locales';

import { useBaseFormSchema } from '../data';

const emits = defineEmits(['success']);
const userStore = useUserStore();
const formData = ref<any>();

// 基础表单
const [BaseForm, baseFormApi] = useVbenForm({
  schema: useBaseFormSchema(),
  showDefaultActions: false,
});

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await baseFormApi.validate();
    if (!valid) return;
    drawerApi.lock();

    try {
      const values = await baseFormApi.getValues();

      // 移除 confirmPassword 字段
      delete values.confirmPassword;

      // 将 roleId 数组转换为逗号分隔的字符串
      const roleIds = values.roleId?.length ? values.roleId.join(',') : '';

      // 整理提交数据
      const submitData: any = {
        ...values,
        roleId: roleIds,
        tenantId: userStore.currentCompanyId,
      };
      // 如果是编辑模式，传递 id
      if (id.value) {
        submitData.id = id.value;

        // 如果没有填写密码，则不传该字段
        if (!values.password) {
          delete submitData.password;
        }
        await updateUserApi(submitData);
      } else {
        await createUserApi(submitData);
      }

      emits('success');
      drawerApi.close();
    } catch {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<any>();

      const isEdit = !!data?.id;
      // 重置表单
      baseFormApi.resetForm();
      baseFormApi.updateSchema([
        {
          fieldName: 'isEditPassword',
          hide: true,
          defaultValue: !isEdit,
        },
        {
          fieldName: 'account',
          disabled: isEdit,
        },
      ]);

      if (data) {
        formData.value = data;
        id.value = data.id;

        // 处理 roleId：将字符串转换为数组
        if (data.roleId && typeof data.roleId === 'string') {
          data.roleId = data.roleId.split(',').filter(Boolean);
        }

        // 编辑时移除密码字段，不回显
        delete data.password;
        delete data.confirmPassword;
      } else {
        id.value = undefined;
      }

      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();
      if (data) {
        baseFormApi.setValues(data);
      }
    }
  },
});

const getDrawerTitle = computed(() =>
  id.value ? $t('common.edit', '任务') : $t('common.create', '任务'),
);

type RepeatMode = 'month' | 'week';
const repeatMode = ref<RepeatMode>('week');
const draftSelected = ref<number[]>([]);

const weekOptions = [
  { label: '星期一', value: 1 },
  { label: '星期二', value: 2 },
  { label: '星期三', value: 3 },
  { label: '星期四', value: 4 },
  { label: '星期五', value: 5 },
  { label: '星期六', value: 6 },
  { label: '星期日', value: 7 },
];

const daysInMonth = ref(31);

function parseRepeatTime(value: unknown, mode: RepeatMode): number[] {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];

  const parts = raw
    .split(/[,\s，]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (mode === 'week') {
    const labelToValue = new Map(weekOptions.map((o) => [o.label, o.value]));
    const nums = parts
      .map((p) => (labelToValue.has(p) ? labelToValue.get(p) : Number(p)))
      .filter((n) => Number.isFinite(n))
      .map(Number)
      .filter((n) => n >= 1 && n <= 7);
    return [...new Set(nums)].sort((a, b) => a - b);
  }

  const max = daysInMonth.value;
  const nums = parts
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .map(Number)
    .filter((n) => n >= 1 && n <= max);
  return [...new Set(nums)].sort((a, b) => a - b);
}

function formatRepeatTime(values: number[], mode: RepeatMode) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (mode === 'week') {
    const valueToLabel = new Map(weekOptions.map((o) => [o.value, o.label]));
    return sorted.map((v) => valueToLabel.get(v) || String(v)).join(',');
  }
  return sorted.join(',');
}

const modalTitle = computed(() =>
  repeatMode.value === 'week' ? '每周' : '每月',
);

const [RepeatTimeModal, repeatTimeModalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  class: 'w-[520px]',
  async onConfirm() {
    const value = formatRepeatTime(draftSelected.value, repeatMode.value);
    baseFormApi.setValues({ repeatTime: value });
    repeatTimeModalApi.close();
  },
});

async function openRepeatTimePicker() {
  const values = await baseFormApi.getValues<any>();
  const cycle = values?.cycle;
  if (cycle !== '1' && cycle !== '2') return;

  if (values.startTime) {
    const d = new Date(values.startTime);
    daysInMonth.value = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
    ).getDate();
  } else {
    const now = new Date();
    daysInMonth.value = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
  }

  repeatMode.value = cycle === '1' ? 'week' : 'month';
  draftSelected.value = parseRepeatTime(values?.repeatTime, repeatMode.value);
  repeatTimeModalApi.open();
}

function toggleDraft(v: number) {
  const set = new Set(draftSelected.value);
  if (set.has(v)) set.delete(v);
  else set.add(v);
  draftSelected.value = [...set].sort((a, b) => a - b);
}
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <RepeatTimeModal :title="modalTitle">
      <div class="px-6 py-6 pb-8">
        <div v-if="repeatMode === 'week'" class="grid grid-cols-4 gap-4">
          <button
            v-for="opt in weekOptions"
            :key="opt.value"
            class="flex h-[44px] items-center justify-center rounded-[4px] bg-[#f5f5f5] text-[14px] text-[#333] transition-colors hover:bg-[#e8e8e8]"
            :class="
              draftSelected.includes(opt.value)
                ? '!bg-[#409eff] !text-white'
                : ''
            "
            type="button"
            @click="toggleDraft(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div v-else class="grid grid-cols-7 gap-x-3 gap-y-4">
          <button
            v-for="day in daysInMonth"
            :key="day"
            class="flex h-[44px] items-center justify-center rounded-[4px] bg-[#f5f5f5] text-[14px] text-[#333] transition-colors hover:bg-[#e8e8e8]"
            :class="
              draftSelected.includes(day) ? '!bg-[#409eff] !text-white' : ''
            "
            type="button"
            @click="toggleDraft(day)"
          >
            {{ day }}
          </button>
        </div>
      </div>
    </RepeatTimeModal>

    <BaseForm>
      <template #startTimeType="slotProps">
        <div class="flex w-full items-center gap-2">
          <ElSelect
            v-model="slotProps.model[slotProps.field]"
            placeholder="请选择"
            class="flex-1"
            clearable
            filterable
          >
            <ElOption label="之前" value="1" />
            <ElOption label="立即" value="2" />
            <ElOption label="之后" value="3" />
          </ElSelect>
          <ElInput
            v-model="slotProps.model.timeData"
            placeholder="20min"
            class="flex-1"
          >
            <template #prefix>
              <div class="i-lucide:clock text-gray-400"></div>
            </template>
          </ElInput>
        </div>
      </template>
      <template #repeatTime="slotProps">
        <ElInput
          v-bind="slotProps"
          readonly
          placeholder="请选择重复时间"
          @click="openRepeatTimePicker"
        />
      </template>
    </BaseForm>
  </Drawer>
</template>
