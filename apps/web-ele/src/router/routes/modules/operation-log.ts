import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:file-clock',
      order: 110,
      title: '操作记录',
    },
    name: 'OperationLog',
    path: '/operation-log',
    children: [
      {
        name: 'OperationLogList',
        path: '/operation-log/list',
        component: () => import('#/views/operation-log/list/index.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          title: '操作记录',
        },
      },
    ],
  },
];

export default routes;
