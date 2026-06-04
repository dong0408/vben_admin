<script lang="ts" setup>
import { computed, useSlots } from 'vue';

interface Props {
  /** Grid columns count, defaults to the number of slot children */
  columns?: number;
  /** Left image URL */
  image?: string;
  /** Image area width */
  imageWidth?: string;
}

const props = withDefaults(defineProps<Props>(), {
  columns: 0,
  image: '',
  imageWidth: '200px',
});

const slots = useSlots();

const columnCount = computed(() => {
  if (props.columns > 0) return props.columns;
  const children = slots.default?.() ?? [];
  return children.length || 1;
});

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columnCount.value}, 1fr)`,
}));
</script>

<template>
  <div class="stats-grid">
    <!-- Top gradient border -->
    <div class="stats-grid__border"></div>

    <div class="stats-grid__body">
      <!-- Left image area -->
      <div
        v-if="image || $slots.image"
        class="stats-grid__image"
        :style="{ width: imageWidth }"
      >
        <slot name="image">
          <img :src="image" alt="" class="stats-grid__img" />
        </slot>
      </div>

      <!-- Right grid cells -->
      <div class="stats-grid__cells" :style="gridStyle">
        <template v-if="$slots.default">
          <div
            v-for="(child, index) in $slots.default()"
            :key="index"
            class="stats-grid__cell"
          >
            <component :is="child" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0a1628 0%, #0f1f3d 100%);
  border-radius: 8px;
}

.stats-grid__border {
  height: 3px;
  background: linear-gradient(90deg, #0ea5e9, #3b82f6, #6366f1);
}

.stats-grid__body {
  display: flex;
  align-items: center;
  min-height: 80px;
}

.stats-grid__image {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
}

.stats-grid__img {
  max-width: 100%;
  max-height: 64px;
  object-fit: contain;
}

.stats-grid__cells {
  display: grid;
  flex: 1;
  min-height: 80px;
}

.stats-grid__cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
}

/* Blue vertical divider between cells */
.stats-grid__cell + .stats-grid__cell::before {
  position: absolute;
  top: 15%;
  bottom: 15%;
  left: 0;
  width: 1px;
  content: '';
  background: linear-gradient(
    180deg,
    transparent,
    rgb(59 130 246 / 60%),
    transparent
  );
}
</style>
