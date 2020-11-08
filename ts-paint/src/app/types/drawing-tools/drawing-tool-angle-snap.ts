export enum DrawingToolAngleSnap {
  NONE,
  DIAGONAL, // When holding Shift key, snap to angles where ±dw = ±dh
  EVERY_45_DEGREES, // When holding Shift key, snap to angles where ±dw = ±dh OR dw = 0 OR dh = 0
}
