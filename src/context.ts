export let currentObserver: number | null = null;

export function setObserver(idx: number | null): number | null {
  const prev = currentObserver;
  currentObserver = idx;
  return prev;
}