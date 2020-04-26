import { Point } from '../types/base/point';

export class PointSet {
  private readonly indexes: Set<number>;

  constructor(private imageWidth: number) {
    this.indexes = new Set<number>();
  }

  get size(): number {
    return this.indexes.size;
  }

  add(point: Point) {
    this.indexes.add(this.pointToIndex(point));
  }

  delete(point: Point) {
    this.indexes.delete(this.pointToIndex(point));
  }

  forEach(doWhat: (point: Point) => void) {
    this.indexes.forEach(index => doWhat(this.indexToPoint(index)))
  }

  has(point: Point): boolean {
    return this.indexes.has(this.pointToIndex(point));
  }

  private pointToIndex(point: Point): number {
    return point.w + this.imageWidth * point.h;
  }

  private indexToPoint(index: number): Point {
    const h: number = Math.floor(index / this.imageWidth);
    const w: number = index - this.imageWidth * h;

    return { w, h };
  }

}