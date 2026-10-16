"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api/client";

async function fetchReady() {
  // 503 carries a ReadyResponse body ("degraded"); network errors / non-API responses throw.
  const { data, error } = await api.GET("/api/v1/health/ready");
  const body = data ?? error;
  if (!body || !Array.isArray(body.checks)) {
    throw new Error("unexpected readiness response");
  }
  return body;
}

async function fetchMeta() {
  const { data } = await api.GET("/api/v1/meta");
  if (!data) throw new Error("unexpected meta response");
  return data;
}

export function SystemStatus() {
  const t = useTranslations("system");
  const ready = useQuery({ queryKey: ["health", "ready"], queryFn: fetchReady });
  const meta = useQuery({ queryKey: ["meta"], queryFn: fetchMeta });

  let label = t("status.loading");
  let variant: "secondary" | "default" | "destructive" = "secondary";
  if (ready.isError) {
    label = t("status.unreachable");
    variant = "destructive";
  } else if (ready.data) {
    const degraded = ready.data.status !== "ok";
    label = t(degraded ? "status.degraded" : "status.online");
    variant = degraded ? "destructive" : "default";
  }

  const failing = ready.data?.checks.filter((c) => !c.ok).map((c) => c.name) ?? [];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div>
          <Badge variant={variant}>{label}</Badge>
        </div>
        {failing.length > 0 && (
          <p className="text-sm">{t("failingChecks", { names: failing.join(", ") })}</p>
        )}
        {meta.data && (
          <p className="text-sm text-muted-foreground">
            {t("version", { version: meta.data.version })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
