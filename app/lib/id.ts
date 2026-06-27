export function generateFilterId(): string {
  return `f_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}
