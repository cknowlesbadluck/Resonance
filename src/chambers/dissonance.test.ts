import { describe, expect, it } from "vitest";
import { detectDissonance, dissonanceEvent, shouldDissolveForDissonance } from "./dissonance";

describe("chamber dissonance", () => {
  it("ignores a single agent correcting itself", () => {
    expect(detectDissonance([
      { agentId: "grok", subject: "ready", value: "503", confidence: 0.9 },
      { agentId: "grok", subject: "ready", value: "200", confidence: 0.95 },
    ])).toEqual([]);
  });

  it("watches a low-confidence disagreement and blocks two high-confidence ones", () => {
    const watch = detectDissonance([
      { agentId: "grok", subject: "host", value: "netlify", confidence: 0.4 },
      { agentId: "claude", subject: "host", value: "vercel", confidence: 0.4 },
    ]);
    expect(watch[0]?.severity).toBe("watch");
    expect(shouldDissolveForDissonance(watch)).toBe(false);

    const block = detectDissonance([
      { agentId: "grok", subject: "host", value: "netlify", confidence: 0.9 },
      { agentId: "claude", subject: "host", value: "vercel", confidence: 0.91 },
    ]);
    expect(block[0]?.severity).toBe("block");
    expect(shouldDissolveForDissonance(block)).toBe(true);
    expect(dissonanceEvent("chamber-1", block[0], "2026-10-09T09:02:11Z").type).toBe("dissonance.detected");
  });
});
