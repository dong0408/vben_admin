import type { App, Directive, DirectiveBinding } from 'vue';

import { useAccessStore } from '@vben/stores';

function isAuth(el: Element, binding: DirectiveBinding) {
  const accessStore = useAccessStore();
  const value = binding.value;

  if (!value) return;

  const authValues = Array.isArray(value) ? value : [value];
  const accessCodes = accessStore.accessCodes || [];

  const hasAuth =
    accessCodes.includes('super_admin') || // Optional: Super admin bypass
    authValues.some((code) => accessCodes.includes(code));

  if (!hasAuth && el.parentNode) {
    el.remove();
  }
}

const authDirective: Directive = {
  mounted: isAuth,
  updated: isAuth,
};

export function registerAuthDirective(app: App) {
  app.directive('auth', authDirective);
}

/**
 * <!-- 单个权限 -->
<el-button v-auth="'system:user:add'">新增用户</el-button>

<!-- 多个权限（只要满足其一） -->
<el-button v-auth="['system:user:edit', 'system:user:update']">编辑用户</el-button>
 */
