import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:route',
      order: 20,
      title: '路线管理',
    },
    name: 'RouteModule',
    path: '/route',
    children: [
      {
        name: 'RouteList',
        path: '/route/list',
        component: () => import('#/views/route/index.vue'),
        meta: {
          icon: 'lucide:map',
          title: '路线列表',
        },
      },
    ],
  },
];

export default routes;
