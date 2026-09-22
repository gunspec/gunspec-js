import { defineConfig } from 'vitest/config'

/**
 * Integration run against a live API. Needs `GUNSPEC_INTEGRATION_BASE_URL`
 * and `GUNSPEC_INTEGRATION_API_KEY` in the environment; the suite skips itself
 * otherwise, so `pnpm test` never touches the network.
 */
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
})
