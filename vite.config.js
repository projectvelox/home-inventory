import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__:  JSON.stringify(new Date().toISOString().split('T')[0]),
  },
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // Skip gzip size reporting — speeds up the build
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor libs into separate long-cached chunks
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('@supabase/supabase-js') || id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('@zxing')) {
            return 'vendor-zxing'
          }
        },
      },
    },
  },
  // Pre-bundle only what the client actually uses
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
    exclude: ['@zxing/browser', '@anthropic-ai/sdk'],
  },
})
