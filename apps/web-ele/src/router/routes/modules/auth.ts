import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'Auth',
    meta: {
      title: '权限演示',
      icon: 'lucide:shield',
      order: 1000,
    },
    children: [
      {
        path: '/auth/permission',
        name: 'Permission',
        component: () => import('#/views/auth/permission/index.vue'),
        meta: {
          title: '权限测试',
        },
      },
      {
        path: '/auth/role',
        name: 'AuthRole',
        component: () => import('#/views/auth/role/index.vue'),
        meta: {
          title: '角色测试',
        },
      },
    ],
  },
];

export default routes;
