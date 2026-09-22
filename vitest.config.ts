import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    // `*.test-d.ts` files are type-level: `tests/unit/types-mirror.test-d.ts`
    // holds every hand-written model to the generated OpenAPI schema and only
    // fails at compile time, so the run type-checks them as part of the suite.
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test-d.ts'],
      tsconfig: './tsconfig.tests.json',
    },
  },
})
