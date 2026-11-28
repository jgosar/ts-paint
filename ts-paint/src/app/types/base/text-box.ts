import { RectangleArea } from './rectangle-area';

/** The text box of the text tool while the user types into it; its start is its top left corner */
export interface TextBox {
  area: RectangleArea;
  text: string;
}
