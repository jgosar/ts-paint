import { replaceStringBetweenIndexes } from './string.helpers';

export function simulateTextChange(oldText: string, event: KeyboardEvent | ClipboardEvent): string {
  let selectionStart: number = (event.target as any).selectionStart;
  let selectionEnd: number = (event.target as any).selectionEnd;
  let valueToInsert: string;
  if (event instanceof KeyboardEvent) {
    if (event.key.length === 1) {
      // It's some kind of a character that we need to insert
      valueToInsert = event.key;
    } else {
      valueToInsert = '';
      if (event.key === 'Backspace') {
        if (selectionStart === selectionEnd) {
          // If no text is selected, the Backspace key deletes 1 character before the cursor
          selectionStart = Math.max(0, selectionStart - 1);
        }
      } else if (event.key === 'Delete') {
        if (selectionStart === selectionEnd) {
          // If no text is selected, the Delete key deletes 1 character after the cursor
          selectionEnd = Math.min(oldText.length, selectionEnd + 1);
        }
      } else {
        selectionStart = selectionEnd;
      }
    }
  } else {
    valueToInsert = event.clipboardData.getData('text/plain');
  }

  const newText: string = replaceStringBetweenIndexes(oldText, selectionStart, selectionEnd, valueToInsert);

  return newText;
}
