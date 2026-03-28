export function arrayIncludes<T>(values: readonly T[], target: T): boolean {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === target) {
      return true;
    }
  }
  return false;
}

export function findFirst<T>(
  values: readonly T[],
  predicate: (value: T, index: number) => boolean,
): T | null {
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (predicate(value, index)) {
      return value;
    }
  }
  return null;
}

export function findIndexBy<T>(
  values: readonly T[],
  predicate: (value: T, index: number) => boolean,
): number {
  for (let index = 0; index < values.length; index += 1) {
    if (predicate(values[index], index)) {
      return index;
    }
  }
  return -1;
}

export function padStart2(value: number | string): string {
  const text = String(value);
  return text.length >= 2 ? text : `0${text}`;
}

export function stringIncludes(value: string, search: string): boolean {
  return value.indexOf(search) !== -1;
}

export function uniqueStrings(values: readonly string[]): string[] {
  const seen: Record<string, true> = Object.create(null);
  const result: string[] = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (seen[value]) {
      continue;
    }
    seen[value] = true;
    result.push(value);
  }

  return result;
}
