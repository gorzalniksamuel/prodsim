import createClient from "openapi-fetch";
import type { paths } from "./schema";

// Browser-only: baseUrl "" is same-origin and cannot be resolved in server code,
// so server components / route handlers must not use this client.
// Same-origin: in production /api/* is proxied to the backend by the Next.js rewrite.
// `fetch` is resolved per call (not captured at import) so test doubles can replace it.
export const api = createClient<paths>({
  baseUrl: "",
  fetch: (request) => globalThis.fetch(request),
});
