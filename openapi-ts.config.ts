import type { UserConfig } from '@hey-api/openapi-ts';

/**
 * All API code generation configs. Run: npm run api:generate
 *
 * Each entry generates one `src/api/<name>/generated/` directory.
 * Hey API v0.94 CLI handles array configs natively.
 */
const configs: UserConfig[] = [
  /**
   * Petstore API (demo)
   * Swap `input` and update `baseUrl` in src/api/petstore/client.ts when replacing.
   */
  {
    input: 'https://petstore3.swagger.io/api/v3/openapi.json',
    output: { path: 'src/api/petstore/generated', clean: true },
    plugins: [
      '@hey-api/typescript',
      'zod',
      '@tanstack/react-query',
      '@hey-api/client-fetch',
    ],
  },

  /**
   * Your API (placeholder — activate when spec is available)
   * 1. Uncomment this block and replace `input` with your OpenAPI spec URL
   * 2. Update `baseUrl` in src/api/example/client.ts
   * 3. Uncomment the exampleClient lines in src/api/example/client.ts
   * 4. Import '@/api/example/client' in src/main.tsx
   */
  // {
  //   input: 'https://your-api.com/openapi.json',
  //   output: { path: 'src/api/example/generated', clean: true },
  //   plugins: [
  //     '@hey-api/typescript',
  //     'zod',
  //     '@tanstack/react-query',
  //     '@hey-api/client-fetch',
  //   ],
  // },
];

export default configs;
