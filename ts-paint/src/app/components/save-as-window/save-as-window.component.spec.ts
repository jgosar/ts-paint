import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaveAsWindowComponent } from './save-as-window.component';
import { ModalWindowComponent } from '../modal-window/modal-window.component';
import { TextInputComponent } from '../inputs/text-input/text-input.component';
import { DropdownComponent } from '../inputs/dropdown/dropdown.component';
import { ImageFileFormat } from '../../types/base/image-file-format';
import { afterTimeout, keyup, setInputText } from '../../../testing/events';

describe('SaveAsWindowComponent', () => {
  let fixture: ComponentFixture<SaveAsWindowComponent>;
  let component: SaveAsWindowComponent;
  let saved: { fileName: string; format: ImageFileFormat }[];
  let cancelled: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SaveAsWindowComponent, ModalWindowComponent, TextInputComponent, DropdownComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SaveAsWindowComponent);
    component = fixture.componentInstance;
    saved = [];
    cancelled = 0;
    component.save.subscribe((params) => saved.push(params));
    component.cancel.subscribe(() => cancelled++);
  });

  function render(fileName: string = 'picture', fileFormat: ImageFileFormat = 'jpeg') {
    fixture.componentRef.setInput('fileName', fileName);
    fixture.componentRef.setInput('fileFormat', fileFormat);
    fixture.detectChanges();
  }

  function nameInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('tsp-text-input input');
  }

  function dropdown(): HTMLElement {
    return fixture.nativeElement.querySelector('tsp-dropdown .tsp-dropdown');
  }

  function dropdownLabel(): string {
    return fixture.nativeElement.querySelector('.tsp-dropdown__input').textContent.trim();
  }

  function openDropdown() {
    fixture.nativeElement.querySelector('tsp-dropdown .tsp-depressed-item-container').click();
    fixture.detectChanges();
  }

  function dropdownOptions(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));
  }

  function buttonLabelled(label: string): HTMLButtonElement {
    return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button')).find(
      (button) => button.textContent.trim() === label
    );
  }

  function typeName(text: string) {
    setInputText(nameInput(), text);
    fixture.detectChanges();
  }

  it('starts with the given file name and format', () => {
    render('holiday', 'jpeg');
    expect(fixture.nativeElement.querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe('Save As');
    expect(nameInput().value).toBe('holiday');
    expect(dropdownLabel()).toBe('JPEG');
  });

  it('focuses the name field after the view is initialised', async () => {
    render();
    await afterTimeout();
    expect(document.activeElement).toBe(nameInput());
    expect(nameInput().selectionEnd, 'name is selected for overtyping').toBe('picture'.length);
  });

  it('emits the trimmed name and the format on Save', () => {
    render('picture', 'png');
    typeName('  my drawing ');
    buttonLabelled('Save').click();
    expect(saved).toEqual([{ fileName: 'my drawing', format: 'png' }]);
  });

  it('refocuses the name field instead of saving when the name is blank', async () => {
    render();
    await afterTimeout();
    nameInput().blur();
    typeName('   ');
    buttonLabelled('Save').click();
    expect(saved).toEqual([]);
    expect(document.activeElement).not.toBe(nameInput());
    await afterTimeout();
    expect(document.activeElement).toBe(nameInput());
  });

  it('offers PNG and JPEG as formats', () => {
    render();
    openDropdown();
    expect(dropdownOptions().map((o) => o.textContent.trim())).toEqual(['PNG', 'JPEG']);
  });

  it('saves with the format picked in the dropdown', () => {
    render('picture', 'jpeg');
    openDropdown();
    dropdownOptions()[0].click();
    fixture.detectChanges();
    expect(dropdownLabel()).toBe('PNG');
    buttonLabelled('Save').click();
    expect(saved).toEqual([{ fileName: 'picture', format: 'png' }]);
  });

  it('saves on Enter in the name field', () => {
    render();
    nameInput().dispatchEvent(keyup('Enter'));
    expect(saved).toEqual([{ fileName: 'picture', format: 'jpeg' }]);
  });

  it('does not save when Enter toggles the dropdown', () => {
    render();
    dropdown().dispatchEvent(keyup('Enter'));
    expect(saved).toEqual([]);
  });

  it('cancels on Escape, on the Cancel button and on the title bar X', () => {
    render();
    nameInput().dispatchEvent(keyup('Escape'));
    expect(cancelled).toBe(1);
    buttonLabelled('Cancel').click();
    expect(cancelled).toBe(2);
    fixture.nativeElement.querySelector('.tsp-modal-window__close-button').click();
    expect(cancelled).toBe(3);
    expect(saved).toEqual([]);
  });

  it('lets a closed dropdown pass Escape on to cancel the window, but not an open one', () => {
    render();
    openDropdown();
    dropdown().dispatchEvent(keyup('Escape'));
    fixture.detectChanges();
    expect(cancelled, 'Escape only closed the list').toBe(0);
    expect(dropdownOptions().length).toBe(0);
    dropdown().dispatchEvent(keyup('Escape'));
    expect(cancelled).toBe(1);
  });
});
