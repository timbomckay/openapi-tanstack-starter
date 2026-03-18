import type { UserConfig } from '@hey-api/openapi-ts';

/**
 * All API code generation configs.
 *
 * Each entry generates one `src/api/<name>/generated/` directory.
 * Run: npm run api:generate
 *
 * Note: `defineConfig` from Hey API v0.76 does not type array syntax,
 * so configs are exported as a plain typed array and run via
 * scripts/api-generate.ts (which calls `createClient` directly).
 */
const configs: UserConfig[] = [
  /**
   * Petstore API (demo)
   * Swap `input` and update `baseUrl` in src/api/petstore/client.ts when replacing.
   */
  {
    input: 'https://petstore3.swagger.io/api/v3/openapi.json',
    output: { path: 'src/api/petstore/generated', clean: true },
    plugins: ['@hey-api/typescript', 'zod', '@tanstack/react-query', '@hey-api/client-fetch'],
  },

  /**
   * NBA API (placeholder — activate when spec is available)
   * 1. Uncomment this block and replace `input` with your OpenAPI spec URL
   * 2. Update `baseUrl` in src/api/nba/client.ts
   * 3. Uncomment the nbaClient lines in src/api/nba/client.ts
   * 4. Import '@/api/nba/client' in src/main.tsx
   */
  // {
  //   input: 'https://your-nba-api.com/openapi.json',
  //   output: { path: 'src/api/nba/generated', clean: true },
  //   plugins: [
  //     '@hey-api/typescript',
  //     'zod',
  //     '@tanstack/react-query',
  //     '@hey-api/client-fetch',
  //   ],
  // },
];

export default configs;
