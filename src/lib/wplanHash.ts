// Deterministic hash used by the wplan map to render stable per-(metric, code)
// colours and per-dept signature mocks until the relevant per-geo backend
// endpoints exist. Pure function — no React, no DOM. Lifted out of the hooks
// so it can be unit-tested.

export function hashCode(input: string): number {
  let hash = 0;
  if (!input.length) return hash;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
