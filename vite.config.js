import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/auth': {
          target: env.AUTH_SERVICE_URL || 'http://localhost:8081',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/auth/, ''),
        },
        '/conversion': {
          target: env.CONVERSION_SERVICE_URL || 'http://localhost:8080',
          changeOrigin: true,
        }
      }
    }
  };
})
