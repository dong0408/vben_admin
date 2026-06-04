<script lang="ts" setup>
import type { RouteApi } from '#/api/route';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createRouteApi, updateRouteApi } from '#/api/route';

import { useBaseFormSchema } from '../data';
import MapPicker from './map-picker.vue';

defineOptions({ name: 'RouteForm' });

const emits = defineEmits(['success']);

const id = ref<string | undefined>();
const points = ref<RouteApi.RoutePoint[]>([]);

const [BaseForm, baseFormApi] = useVbenForm({
  schema: useBaseFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const getDrawerTitle = computed(() => (id.value ? '编辑路线' : '新增路线'));

const [Drawer, drawerApi] = useVbenDrawer({
  class: 'w-[900px]',

  async onConfirm() {
    // 将最新 points 回填到表单后再校验
    baseFormApi.setValues({ points: points.value });
    const { valid } = await baseFormApi.validate();
    if (!valid) return;

    drawerApi.lock();
    try {
      const values = await baseFormApi.getValues();
      const submitData: Partial<RouteApi.RouteItem> = {
        name: values.name,
        code: values.code,
        type: values.type,
        status: Number(values.status ?? 1),
        remark: values.remark,
        points: [...points.value],
      };

      if (id.value) {
        submitData.id = id.value;
        await updateRouteApi(submitData);
        ElMessage.success('路线更新成功');
      } else {
        await createRouteApi(submitData);
        ElMessage.success('路线创建成功');
      }

      emits('success');
      drawerApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      drawerApi.unlock();
    }
  },

  async onOpenChange(isOpen) {
    if (!isOpen) return;

    const data = drawerApi.getData<any>();
    baseFormApi.resetForm();
    points.value = [];

    if (data?.id) {
      id.value = data.id;
      await nextTick();
      baseFormApi.setValues({
        name: data.name,
        code: data.code,
        type: data.type,
        status: Number(data.status ?? 1),
        remark: data.remark,
        points: data.points || [],
      });
      points.value = Array.isArray(data.points) ? [...data.points] : [];
    } else {
      id.value = undefined;
      await nextTick();
      baseFormApi.setValues({ status: 1, points: [] });
    }
  },
});

function handlePointsChange(val: RouteApi.RoutePoint[]) {
  points.value = val;
  baseFormApi.setValues({ points: val });
}
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <div class="route-form-wrap">
      <BaseForm>
        <template #points>
          <MapPicker
            :model-value="points"
            @update:model-value="handlePointsChange"
          />
        </template>
      </BaseForm>
    </div>
  </Drawer>
</template>

<style scoped>
.route-form-wrap {
  padding: 4px 8px 16px;
}
</style>
