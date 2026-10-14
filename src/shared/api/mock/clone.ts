export function cloneSeed<T>(seed: T): T {
  return JSON.parse(JSON.stringify(seed)) as T;
}

export function resetArray<T>(target: T[], seed: readonly T[]): void {
  target.length = 0;
  target.push(...cloneSeed([...seed]));
}
