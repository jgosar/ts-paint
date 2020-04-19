export function assertUnreachable(x: never) {

}

export function isDefined(object: any) {
  return object !== null && object !== undefined;
}

export function isEmpty(array: any[]) {
  return !isDefined(array) || array.length === 0;
}

export function lastElement<T>(array: T[]): T | undefined {
  if (!isEmpty(array)) {
    return array[array.length - 1];
  }
}
