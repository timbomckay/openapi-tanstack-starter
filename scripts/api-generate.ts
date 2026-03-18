/**
 * API code generation runner.
 *
 * Calls Hey API's `createClient` directly with the array from
 * `openapi-ts.config.ts`. The Hey API CLI (openapi-ts -f) cannot be used
 * because c12+defu (used internally) does not preserve top-level arrays.
 *
 * Run via: npm run api:generate
 */
import { createClient } from '@hey-api/openapi-ts';

import configs from '../openapi-ts.config.ts';

// Cast needed: v0.76 public types only expose single-config input,
// but the runtime fully supports UserConfig[].
await createClient(configs as unknown as Parameters<typeof createClient>[0]);
