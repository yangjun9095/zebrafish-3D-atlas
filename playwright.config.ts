import { defineConfig } from '@playwright/test'

const port = 4173

// Uses the system Chrome. On a node without a GPU, the flags below select
// SwiftShader so WebGL still renders.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1600, height: 900 },
    launchOptions: {
      args: [
        '--no-sandbox',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
      ],
    },
  },
  webServer: {
    command: `npm run preview -- --port ${port}`,
    port,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
