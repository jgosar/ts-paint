export enum DrawingToolType {
  /*freeFormSelect,*/
  rectangleSelect,
  /*eraser,*/
  colorFiller,
  colorPicker,
  magnifier,
  pencil,
  /*brush,
  airbrush,
  text,*/
  line,
  /*curve,*/
  rectangle,
  /*polygon,*/
  ellipse,
  /*roundedRectangle,*/
}

export const ALL_DRAWING_TOOL_TYPES: DrawingToolType[] = Object.keys(DrawingToolType)
  .map((t) => DrawingToolType[t])
  .filter((t) => typeof t === 'number');
