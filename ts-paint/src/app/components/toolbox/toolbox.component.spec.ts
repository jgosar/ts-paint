import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolboxComponent } from './toolbox.component';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';

describe('ToolboxComponent', () => {
  let fixture: ComponentFixture<ToolboxComponent>;
  let component: ToolboxComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [ToolboxComponent] }).compileComponents();
    fixture = TestBed.createComponent(ToolboxComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedTool', DrawingToolType.pencil);
    fixture.detectChanges();
  });

  function buttons(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-toolbox__button'));
  }

  function selectedButtons(): HTMLElement[] {
    return buttons().filter((button) => button.classList.contains('tsp-toolbox__button--selected'));
  }

  it('renders the 10 drawing tools in enum order, each with its icon class', () => {
    const iconClasses: string[] = buttons().map((button) =>
      Array.from(button.classList).find((c) => c.endsWith('Icon'))
    );
    expect(iconClasses).toEqual([
      'tsp-toolbox__button--rectangleSelectIcon',
      'tsp-toolbox__button--eraserIcon',
      'tsp-toolbox__button--colorFillerIcon',
      'tsp-toolbox__button--colorPickerIcon',
      'tsp-toolbox__button--magnifierIcon',
      'tsp-toolbox__button--pencilIcon',
      'tsp-toolbox__button--brushIcon',
      'tsp-toolbox__button--lineIcon',
      'tsp-toolbox__button--rectangleIcon',
      'tsp-toolbox__button--ellipseIcon',
    ]);
  });

  it('marks only the selected tool', () => {
    expect(selectedButtons().length).toBe(1);
    expect(selectedButtons()[0].classList.contains('tsp-toolbox__button--pencilIcon')).toBe(true);
  });

  it('moves the selected class when the selected tool input changes', () => {
    fixture.componentRef.setInput('selectedTool', DrawingToolType.ellipse);
    fixture.detectChanges();
    expect(selectedButtons().length).toBe(1);
    expect(selectedButtons()[0].classList.contains('tsp-toolbox__button--ellipseIcon')).toBe(true);
  });

  it('emits the tool of a clicked button without changing the selection by itself', () => {
    const emitted: DrawingToolType[] = [];
    component.selectedToolChange.subscribe((tool) => emitted.push(tool));

    buttons()[7].click();
    buttons()[0].click();

    expect(emitted).toEqual([DrawingToolType.line, DrawingToolType.rectangleSelect]);
    expect(selectedButtons()[0].classList.contains('tsp-toolbox__button--pencilIcon')).toBe(true);
  });
});
