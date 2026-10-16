import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/api/v1/health/ready", () =>
    HttpResponse.json({
      status: "ok",
      checks: [
        { name: "database", ok: true, detail: null },
        { name: "valkey", ok: true, detail: null },
      ],
    }),
  ),
  http.get("*/api/v1/meta", () => HttpResponse.json({ name: "ProdSim", version: "0.1.0.dev0" })),
];
