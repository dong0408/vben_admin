import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:book-open-text',
      order: 120,
      title: '日志管理',
    },
    name: 'LogManagement',
    path: '/log',
    children: [
      {
        name: 'VehicleLog',
        path: '/log/vehicle',
        component: () => import('#/views/log/list/index.vue'),
        meta: {
          icon: 'lucide:car',
          title: '车辆日志',
          logType: 'vehicle',
        },
      },
      {
        name: 'TaskLog',
        path: '/log/task',
        component: () => import('#/views/log/list/index.vue'),
        meta: {
          icon: 'lucide:clipboard-list',
          title: '任务日志',
          logType: 'task',
        },
      },
    ],
  },
];

export default routes;
