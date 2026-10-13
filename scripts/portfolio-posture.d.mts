export type Posture = { posture: string; reason: string; [k: string]: unknown };
export function isColdStart(status: unknown): boolean;
export function classifyResonanceReady(body: unknown, status: unknown): Posture;
export function classifyConduitReady(body: unknown, status: unknown): Posture;
export function classifyDevice(healthBody: unknown): Posture;
export function classifyAlias(status: unknown, body: unknown): Posture | null;
