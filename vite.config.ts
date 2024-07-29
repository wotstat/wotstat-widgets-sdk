

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'wotstat-widget-sdk',
      fileName: 'wotstat-widget-sdk'
    },
    minify: 'esbuild'
  },
  plugins: [
    dts({ rollupTypes: true })
  ],
  test: {
    environment: 'jsdom'
  }
})