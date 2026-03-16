import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  // Petstore v3 — swap for your real OpenAPI spec URL or local file path
  input: 'https://petstore3.swagger.io/api/v3/openapi.json',
  output: {
    path: 'src/api/generated',
    clean: true,
  },
  plugins: [
    // TypeScript types (interfaces, enums)
    '@hey-api/typescript',
    // Zod schemas for runtime validation
    'zod',
    // TanStack Query v5 hooks (useQuery, useMutation, queryOptions)
    '@tanstack/react-query',
    // Fetch-based HTTP client
    '@hey-api/client-fetch',
  ],
})
