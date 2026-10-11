import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outExtensions: () => ({ js: '.js' }),
  copy: ['src/infrastructure/grpc/protos'],
})
