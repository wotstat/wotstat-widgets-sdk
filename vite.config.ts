

import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'WotstatWidgetsSdk',
      fileName: 'wotstat-widgets-sdk'
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  plugins: [
    dts({ rollupTypes: true })
  ],
  test: {
    environment: 'jsdom'
  }
})