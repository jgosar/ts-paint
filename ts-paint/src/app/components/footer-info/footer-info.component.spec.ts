import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterInfoComponent } from './footer-info.component';

describe('FooterInfoComponent', () => {
  let fixture: ComponentFixture<FooterInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [FooterInfoComponent] }).compileComponents();
    fixture = TestBed.createComponent(FooterInfoComponent);
  });

  function text(selector: string): string {
    return fixture.nativeElement.querySelector(selector).textContent.trim();
  }

  it('shows the help text, the shape start as "w,h" and the dimensions as "wxh"', () => {
    fixture.componentRef.setInput('helpText', 'Draws a straight line with the selected line width.');
    fixture.componentRef.setInput('shapeStart', { w: 12, h: 34 });
    fixture.componentRef.setInput('shapeDimensions', { w: 56, h: 78 });
    fixture.detectChanges();

    expect(text('.tsp-footer-info__help')).toBe('Draws a straight line with the selected line width.');
    expect(text('.tsp-footer-info__coordinates--shape-start')).toBe('12,34');
    expect(text('.tsp-footer-info__coordinates--shape-dimensions')).toBe('56x78');
  });

  it('shows zero coordinates rather than treating them as missing', () => {
    fixture.componentRef.setInput('shapeStart', { w: 0, h: 0 });
    fixture.componentRef.setInput('shapeDimensions', { w: 0, h: 1 });
    fixture.detectChanges();

    expect(text('.tsp-footer-info__coordinates--shape-start')).toBe('0,0');
    expect(text('.tsp-footer-info__coordinates--shape-dimensions')).toBe('0x1');
  });

  it('shows empty strings when the inputs are undefined', () => {
    fixture.detectChanges();

    expect(text('.tsp-footer-info__help')).toBe('');
    expect(text('.tsp-footer-info__coordinates--shape-start')).toBe('');
    expect(text('.tsp-footer-info__coordinates--shape-dimensions')).toBe('');
  });

  it('clears the coordinates again when the inputs go back to undefined', () => {
    fixture.componentRef.setInput('shapeStart', { w: 1, h: 2 });
    fixture.componentRef.setInput('shapeDimensions', { w: 3, h: 4 });
    fixture.detectChanges();
    fixture.componentRef.setInput('shapeStart', undefined);
    fixture.componentRef.setInput('shapeDimensions', undefined);
    fixture.detectChanges();

    expect(text('.tsp-footer-info__coordinates--shape-start')).toBe('');
    expect(text('.tsp-footer-info__coordinates--shape-dimensions')).toBe('');
  });
});
