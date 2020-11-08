export enum DrawingToolAngleSnap {
  NONE,
  EVERY_90_DEGREES, // When holding Shift key, snap to angles where ±dx = ±dy
  EVERY_45_DEGREES // When holding Shift key, snap to angles where ±dx = ±dy OR dx = 0 OR dy = 0
}
