import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 100,
      title: '任务管理',
    },
    name: 'Task',
    path: '/task',
    children: [
      {
        name: 'TaskManagement',
        path: '/task/list',
        component: () => import('#/views/task/list/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: '任务列表',
        },
      },
      {
        name: 'TaskDetail',
        path: '/task/detail',
        component: () => import('#/views/task/list/detail/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '任务详情',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;
