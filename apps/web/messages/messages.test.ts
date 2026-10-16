import { describe, expect, it } from "vitest";
import de from "./de.json";
import en from "./en.json";

function keys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

describe("messages", () => {
  it("en.json and de.json have identical key sets", () => {
    expect(keys(de).sort()).toEqual(keys(en).sort());
  });
});
