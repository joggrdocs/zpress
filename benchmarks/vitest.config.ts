import codSpeed from '@codspeed/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [codSpeed()],
  test: {
    benchmark: {
      include: ['src/**/*.bench.ts'],
    },
  },
})
