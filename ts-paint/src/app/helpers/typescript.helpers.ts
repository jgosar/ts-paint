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

export function min(numbers: number[]): number {
  let min: number = numbers[0];
  numbers.forEach(number => {
    if (number < min) {
      min = number;
    }
  });

  return min;
}

export function max(numbers: number[]): number {
  let max: number = numbers[0];
  numbers.forEach(number => {
    if (number > max) {
      max = number;
    }
  });

  return max;
}