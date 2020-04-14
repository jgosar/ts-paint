import { RectangleArea } from '../base/rectangle-area';

export interface TsPaintAction {
  name: string,
  preview: boolean,
  affectedArea?: RectangleArea,
  undoImage?: ImageData
}