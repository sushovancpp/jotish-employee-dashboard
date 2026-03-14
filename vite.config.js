import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api': {
        target:       'https://backend.jotish.in',
        changeOrigin: true,
        secure:       true,
        rewrite: path => path.replace(/^\/api\/(.+)$/, '/backend_dev/$1.php'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[proxy]', req.method, proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes) => {
            console.log('[proxy] response status:', proxyRes.statusCode)
          })
        },
      },
    },
  },
})