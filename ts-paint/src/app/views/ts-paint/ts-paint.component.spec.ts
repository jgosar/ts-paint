import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TsPaintComponent } from './ts-paint.component';
import { AppModule } from '../../app.module';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';

describe('TsPaintComponent', () => {
  let fixture: ComponentFixture<TsPaintComponent>;
  let store: TsPaintStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppModule] }).compileComponents();
    fixture = TestBed.createComponent(TsPaintComponent);
    store = TestBed.inject(TsPaintStore);
    fixture.detectChanges();
  });

  it('renders the toolbox, palette and canvas', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('tsp-toolbox')).not.toBeNull();
    expect(element.querySelector('tsp-palette')).not.toBeNull();
    expect(element.querySelector('tsp-zoomable-canvas canvas')).not.toBeNull();
  });

  it('selects the line tool on startup', () => {
    expect(store.state.selectedDrawingTool.type).toBe(DrawingToolType.line);
  });
});
