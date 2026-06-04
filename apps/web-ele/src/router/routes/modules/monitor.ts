import type { RouteRecordRaw } from 'vue-router';

// 导入图标可能需要保证有对应的 lucide icon，这里预设 lucide:monitor
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:monitor-stop',
      order: 10,
      title: '监控大屏',
      // noBasicLayout: true,
    },
    name: 'MonitorScreenModule',
    path: '/monitor',
    // 配置为 Vben5 的 BasicLayout 渲染节点，或者如果想全屏展示可以使用 hideMenu/hideTab 等 meta 配置
    // 为了最大化适应屏幕，建议设置 fullScreen: true 但 vben 5 也可以通过在主内容区占满 100% 来实现
    component: () => import('#/views/monitor/index.vue'),
  },
  {
    meta: {
      hideInMenu: true,
      title: '车辆详情',
    },
    name: 'MonitorDetailModule',
    path: '/monitor/detail',
    // 指向刚为你创建好的详情页面
    component: () => import('#/views/monitor/detail/index.vue'),
  },
];

export default routes;
