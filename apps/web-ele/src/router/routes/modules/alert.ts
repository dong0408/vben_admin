import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bell-ring',
      order: 105,
      title: '预警中心',
    },
    name: 'AlertCenter',
    path: '/alert',
    children: [
      {
        name: 'AlertCenterList',
        path: '/alert/center',
        component: () => import('#/views/alert/index.vue'),
        meta: {
          icon: 'lucide:bell-ring',
          title: '预警中心',
        },
      },
    ],
  },
];

export default routes;
