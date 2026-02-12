import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '/api'), // Keep /api prefix if backend needs it, or remove if not. Interface says http://192.168.0.4:2888/api/blade-auth/..., so we likely need /api mapped to /api or just base path.
            // Let's assume /api in frontend maps to /api in backend.
            target: 'http://192.168.0.4:2888',
            ws: true,
          },
        },
      },
    },
  };
});
