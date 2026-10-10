export enum BrushForm {
  ROUND,
  SQUARE,
  FORWARD_DIAGONAL,
  BACKWARD_DIAGONAL,
}

/** For diagonals `size` is the length of the 1 px wide line, for the other forms the side of the bounding square */
export interface BrushShape {
  form: BrushForm;
  size: number;
}

/** The 12 brushes of MS Paint in picker order (row by row): round 7/4/1, square 8/5/2, "/" 9/5/3, "\" 9/5/3 */
export const ALL_BRUSH_SHAPES: BrushShape[] = [
  { form: BrushForm.ROUND, size: 7 },
  { form: BrushForm.ROUND, size: 4 },
  { form: BrushForm.ROUND, size: 1 },
  { form: BrushForm.SQUARE, size: 8 },
  { form: BrushForm.SQUARE, size: 5 },
  { form: BrushForm.SQUARE, size: 2 },
  { form: BrushForm.FORWARD_DIAGONAL, size: 9 },
  { form: BrushForm.FORWARD_DIAGONAL, size: 5 },
  { form: BrushForm.FORWARD_DIAGONAL, size: 3 },
  { form: BrushForm.BACKWARD_DIAGONAL, size: 9 },
  { form: BrushForm.BACKWARD_DIAGONAL, size: 5 },
  { form: BrushForm.BACKWARD_DIAGONAL, size: 3 },
];

export function brushShapesEqual(a: BrushShape | undefined, b: BrushShape | undefined): boolean {
  return a !== undefined && b !== undefined && a.form === b.form && a.size === b.size;
}
