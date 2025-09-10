// host/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        auth: 'http://localhost:3001/assets/remoteEntry.js'
      },
      shared: ['react', 'react-dom']
    })
  ],
  build: {
    modulePreload: { polyfill: false },
    rollupOptions: {
      // ignore unresolved remotes during host build
      external: ['auth/Login']
    }
  }
})