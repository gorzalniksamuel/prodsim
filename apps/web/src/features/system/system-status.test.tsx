import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import messages from "../../../messages/en.json";
import { server } from "@/test/msw/server";
import { SystemStatus } from "./system-status";

function renderStatus() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={client}>
        <SystemStatus />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe("SystemStatus", () => {
  it("renders online and version when ready is ok", async () => {
    renderStatus();
    expect(await screen.findByText("API online")).toBeInTheDocument();
    expect(await screen.findByText(/0\.1\.0\.dev0/)).toBeInTheDocument();
  });

  it("renders degraded with failing check name when ready is 503", async () => {
    server.use(
      http.get("*/api/v1/health/ready", () =>
        HttpResponse.json(
          {
            status: "degraded",
            checks: [
              { name: "database", ok: false, detail: "connection refused" },
              { name: "valkey", ok: true, detail: null },
            ],
          },
          { status: 503 },
        ),
      ),
    );
    renderStatus();
    expect(await screen.findByText("API degraded")).toBeInTheDocument();
    expect(screen.getByText(/database/)).toBeInTheDocument();
    expect(screen.queryByText(/valkey/)).not.toBeInTheDocument();
  });

  it("renders unreachable on network error", async () => {
    server.use(http.get("*/api/v1/health/ready", () => HttpResponse.error()));
    renderStatus();
    expect(await screen.findByText("API unreachable")).toBeInTheDocument();
  });
});
