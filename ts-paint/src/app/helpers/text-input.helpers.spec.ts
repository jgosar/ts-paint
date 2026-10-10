import { simulateTextChange } from './text-input.helpers';

/** A keydown event whose target is a text input with the given caret / selection */
function keyEvent(key: string, selectionStart: number, selectionEnd: number = selectionStart): KeyboardEvent {
  const input: HTMLInputElement = document.createElement('input');
  input.value = ''.padEnd(Math.max(selectionStart, selectionEnd), ' ');
  input.setSelectionRange(selectionStart, selectionEnd);
  const event: KeyboardEvent = new KeyboardEvent('keydown', { key });
  Object.defineProperty(event, 'target', { value: input });
  return event;
}

function pasteEvent(text: string, selectionStart: number, selectionEnd: number = selectionStart): ClipboardEvent {
  const input: HTMLInputElement = document.createElement('input');
  input.value = ''.padEnd(Math.max(selectionStart, selectionEnd), ' ');
  input.setSelectionRange(selectionStart, selectionEnd);
  const clipboardData: DataTransfer = new DataTransfer();
  clipboardData.setData('text/plain', text);
  const event: ClipboardEvent = new ClipboardEvent('paste', { clipboardData });
  Object.defineProperty(event, 'target', { value: input });
  return event;
}

describe('simulateTextChange', () => {
  describe('typed characters', () => {
    it('inserts the character at the caret', () => {
      expect(simulateTextChange('abc', keyEvent('X', 1))).toBe('aXbc');
    });

    it('appends when the caret is at the end', () => {
      expect(simulateTextChange('abc', keyEvent('7', 3))).toBe('abc7');
    });

    it('replaces the selection with the character', () => {
      expect(simulateTextChange('abcdef', keyEvent('X', 1, 4))).toBe('aXef');
    });

    it('inserts spaces too', () => {
      expect(simulateTextChange('ab', keyEvent(' ', 1))).toBe('a b');
    });
  });

  describe('Backspace', () => {
    it('deletes the character before the caret', () => {
      expect(simulateTextChange('abc', keyEvent('Backspace', 2))).toBe('ac');
    });

    it('does nothing at the start of the text', () => {
      expect(simulateTextChange('abc', keyEvent('Backspace', 0))).toBe('abc');
    });

    it('deletes the selection without touching the character before it', () => {
      expect(simulateTextChange('abcdef', keyEvent('Backspace', 2, 4))).toBe('abef');
    });
  });

  describe('Delete', () => {
    it('deletes the character after the caret', () => {
      expect(simulateTextChange('abc', keyEvent('Delete', 1))).toBe('ac');
    });

    it('does nothing at the end of the text', () => {
      expect(simulateTextChange('abc', keyEvent('Delete', 3))).toBe('abc');
    });

    it('deletes the selection without touching the character after it', () => {
      expect(simulateTextChange('abcdef', keyEvent('Delete', 2, 4))).toBe('abef');
    });
  });

  describe('non-printing keys', () => {
    it('leave the text unchanged with a plain caret', () => {
      for (const key of ['ArrowLeft', 'Shift', 'Enter', 'Tab', 'Escape', 'Home']) {
        expect(simulateTextChange('abc', keyEvent(key, 1)), key).toBe('abc');
      }
    });

    it('leave the text unchanged even with a selection', () => {
      expect(simulateTextChange('abcdef', keyEvent('ArrowRight', 1, 4))).toBe('abcdef');
    });
  });

  describe('paste', () => {
    it('inserts the plain text from the clipboard at the caret', () => {
      expect(simulateTextChange('ac', pasteEvent('b', 1))).toBe('abc');
    });

    it('replaces the selection with the pasted text', () => {
      expect(simulateTextChange('abcdef', pasteEvent('XYZ', 1, 5))).toBe('aXYZf');
    });

    it('pastes multi character text at the end', () => {
      expect(simulateTextChange('', pasteEvent('hello', 0))).toBe('hello');
    });
  });
});
