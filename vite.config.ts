import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'lib/main.ts',
      name: 'WotstatWidgetsSdk',
      fileName: (format) => {
        if (format === 'es') return 'wotstat-widgets-sdk.js'
        return `wotstat-widgets-sdk.${format}.js`
      },
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