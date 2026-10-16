import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";

// Node's Request rejects relative URLs, but the production client is same-origin
// (baseUrl ""). Resolve them against the jsdom origin so MSW can intercept them.
const NativeRequest = globalThis.Request;
class OriginRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, window.location.href).href : input, init);
  }
}
globalThis.Request = OriginRequest;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
