import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FontsWindowComponent, FONT_SIZES, MORE_FONTS } from './fonts-window.component';
import { ModalWindowComponent } from '../modal-window/modal-window.component';
import { DropdownComponent } from '../inputs/dropdown/dropdown.component';
import { DragDirective } from '../../directives/drag.directive';
import { TextOptions } from '../../types/drawing-tools/drawing-tool-options';
import { Point } from '../../types/base/point';
import { keydown, recordEvents, EventRecorder } from '../../../testing/events';
import { usePageZoom } from '../../../testing/page-zoom.helpers';

const OPTIONS: TextOptions = { fontFamily: 'Arial', fontSize: 10, bold: true, italic: false, underline: false };

describe('FontsWindowComponent', () => {
  usePageZoom();
  let fixture: ComponentFixture<FontsWindowComponent>;
  let component: FontsWindowComponent;
  let changes: Partial<TextOptions>[];
  let recorder: EventRecorder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FontsWindowComponent, ModalWindowComponent, DropdownComponent],
      imports: [DragDirective],
    }).compileComponents();
    fixture = TestBed.createComponent(FontsWindowComponent);
    component = fixture.componentInstance;
    changes = [];
    component.optionsChange.subscribe((change) => changes.push(change));
    setInputs({ options: OPTIONS, fonts: ['Arial', 'Verdana'], position: { w: 50, h: 40 } });
  });

  afterEach(() => recorder?.stop());

  function setInputs(inputs: Record<string, unknown>) {
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
  }

  function dropdowns(): DropdownComponent<unknown>[] {
    return fixture.debugElement
      .queryAll((debugElement) => debugElement.componentInstance instanceof DropdownComponent)
      .map((debugElement) => debugElement.componentInstance)
      .filter((instance, index, all) => all.indexOf(instance) === index);
  }

  function styleButtons(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-fonts-window__style'));
  }

  it('is a floating window titled Fonts at its position', () => {
    const container: HTMLElement = fixture.nativeElement.querySelector('.tsp-modal-window__container');
    expect(fixture.nativeElement.querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe('Fonts');
    expect(container.classList).toContain('tsp-modal-window__container--floating');
    expect([container.style.left, container.style.top]).toEqual(['50px', '40px']);
  });

  it('offers the fonts, and More fonts... only when more can be listed', () => {
    expect(component.familyOptions().map((option) => option.label)).toEqual(['Arial', 'Verdana']);
    setInputs({ canLoadMoreFonts: true });
    expect(component.familyOptions().map((option) => option.label)).toEqual(['Arial', 'Verdana', 'More fonts...']);
    expect(component.familyOptions()[2].value).toBe(MORE_FONTS);
  });

  it('keeps the current font in the list even when it is not installed', () => {
    setInputs({ options: { ...OPTIONS, fontFamily: 'Gone' } });
    expect(component.familyOptions().map((option) => option.label)).toEqual(['Gone', 'Arial', 'Verdana']);
  });

  it('shows the font and size and emits the chosen ones', () => {
    const [family, size] = dropdowns();
    expect(family.value()).toBe('Arial');
    expect(size.value()).toBe(10);
    expect(size.editable()).toBe(true);

    family.valueChange.emit('Verdana');
    size.valueChange.emit(14);

    expect(changes).toEqual([{ fontFamily: 'Verdana' }, { fontSize: 14 }]);
  });

  it('asks for every installed font when More fonts... is chosen', () => {
    let asked: number = 0;
    component.loadMoreFonts.subscribe(() => asked++);
    dropdowns()[0].valueChange.emit(MORE_FONTS);
    expect(asked).toBe(1);
    expect(changes).toEqual([]);
  });

  it('offers the MS Paint sizes and accepts any whole size from 1 to 999', () => {
    expect(component.sizeOptions.map((option) => option.value)).toEqual(FONT_SIZES);
    expect(['13', '1', '999'].map(component.parseSize)).toEqual([13, 1, 999]);
    expect(['', '0', '1000', '12.5', 'abc'].map(component.parseSize)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('shows bold, italic and underline as toggle buttons and flips them', () => {
    expect(styleButtons().map((button) => button.getAttribute('aria-label'))).toEqual(['Bold', 'Italic', 'Underline']);
    expect(styleButtons().map((button) => button.classList.contains('tsp-button--pressed'))).toEqual([
      true,
      false,
      false,
    ]);
    expect(styleButtons().map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false']);

    styleButtons().forEach((button) => button.click());

    expect(changes).toEqual([{ bold: false }, { italic: true }, { underline: true }]);
  });

  it('does not take the focus from the text box when a style button is pressed', () => {
    const mousedown: MouseEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    styleButtons()[1].dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
  });

  it('keeps keys typed in it from the app shortcuts', () => {
    recorder = recordEvents(document, 'keydown');
    fixture.nativeElement.querySelector('.tsp-fonts-window__content').dispatchEvent(keydown('Delete'));
    expect(recorder.events.length).toBe(0);
  });

  it('emits close and position changes from its window', () => {
    let closed: number = 0;
    const positions: Point[] = [];
    component.closeClicked.subscribe(() => closed++);
    component.positionChange.subscribe((position) => positions.push(position));

    (fixture.nativeElement.querySelector('.tsp-modal-window__close-button') as HTMLButtonElement).click();
    const titleBar: HTMLElement = fixture.nativeElement.querySelector('.tsp-modal-window__title-bar');
    titleBar.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 60, clientY: 45, button: 0, pointerId: 1, bubbles: true })
    );
    titleBar.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 70, clientY: 50, button: 0, pointerId: 1, bubbles: true })
    );

    expect(closed).toBe(1);
    expect(positions).toEqual([{ w: 60, h: 45 }]);
  });
});
