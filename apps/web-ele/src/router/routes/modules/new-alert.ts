import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bell-plus',
      order: 106,
      title: '新预警中心',
    },
    name: 'NewAlertCenter',
    path: '/new-alert',
    children: [
      {
        name: 'newAlert',
        path: '/new-alert/center',
        component: () => import('#/views/new-alert/index.vue'),
        meta: {
          icon: 'lucide:bell-plus',
          title: '新预警中心',
        },
      },
    ],
  },
];

export default routes;
