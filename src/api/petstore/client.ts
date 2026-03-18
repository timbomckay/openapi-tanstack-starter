/**
 * Petstore API client.
 *
 * Configures the default Hey API fetch client for the Petstore v3 demo API.
 * This module is imported once in main.tsx as a side-effect so the client is
 * ready before any queries run.
 *
 * Swap `baseUrl` for your real API base URL before production.
 */
import { client } from './generated/client.gen';

client.setConfig({
  baseUrl: 'https://petstore3.swagger.io/api/v3',
});

export { client as petstoreClient };
