/**
 * Chamber dissonance detector.
 *
 * Pure. Two participants asserting different values for the same subject is
 * dissonance. One participant correcting itself is not. Block severity requires
 * two high-confidence disagreements. Watch severity never dissolves a chamber
 * by itself.
 */

export type Claim = {
  agentId: string;
  subject: string;
  value: string;
  confidence: number;
};

export type DissonanceSeverity = "watch" | "block";

export type DissonanceFinding = {
  subject: string;
  agents: string[];
  values: string[];
  severity: DissonanceSeverity;
};

export type DissonanceEvent = {
  type: "dissonance.detected";
  chamberId: string;
  payload: DissonanceFinding;
  createdAt: string;
};

const BLOCK_CONFIDENCE = 0.8;

export function detectDissonance(claims: Claim[]): DissonanceFinding[] {
  const grouped = new Map<string, Claim[]>();
  for (const claim of claims) {
    const subject = claim.subject.trim();
    if (!subject || !claim.agentId.trim()) continue;
    const bucket = grouped.get(subject) ?? [];
    bucket.push(claim);
    grouped.set(subject, bucket);
  }

  const findings: DissonanceFinding[] = [];
  for (const [subject, bucket] of grouped) {
    const byAgent = new Map<string, Claim>();
    for (const claim of bucket) byAgent.set(claim.agentId, claim);
    const distinct = [...byAgent.values()];
    const values = [...new Set(distinct.map((claim) => claim.value))];
    if (values.length < 2 || distinct.length < 2) continue;
    const high = distinct.filter((claim) => claim.confidence >= BLOCK_CONFIDENCE);
    const highValues = new Set(high.map((claim) => claim.value));
    findings.push({
      subject,
      agents: distinct.map((claim) => claim.agentId).sort(),
      values: values.sort(),
      severity: high.length >= 2 && highValues.size >= 2 ? "block" : "watch",
    });
  }
  return findings.sort((a, b) => a.subject.localeCompare(b.subject));
}

export function shouldDissolveForDissonance(findings: DissonanceFinding[]): boolean {
  return findings.some((finding) => finding.severity === "block");
}

export function dissonanceEvent(chamberId: string, finding: DissonanceFinding, createdAt: string): DissonanceEvent {
  return { type: "dissonance.detected", chamberId, payload: finding, createdAt };
}
