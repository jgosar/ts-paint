import { DragDirective } from '../../directives/drag.directive';
import { ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalWindowComponent } from './modal-window.component';
import { usePageZoom } from '../../../testing/page-zoom.helpers';
import { Point } from '../../types/base/point';

describe('ModalWindowComponent', () => {
  let fixture: ComponentFixture<ModalWindowComponent>;
  let component: ModalWindowComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalWindowComponent],
      imports: [DragDirective],
    }).compileComponents();
    fixture = TestBed.createComponent(ModalWindowComponent);
    component = fixture.componentInstance;
  });

  function query(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector);
  }

  it('shows the title in the title bar', () => {
    fixture.componentRef.setInput('title', 'Attributes');
    fixture.detectChanges();
    expect(query('.tsp-modal-window__title-bar .tsp-can-grow').textContent.trim()).toBe('Attributes');
  });

  describe('floating', () => {
    usePageZoom();
    function pointer(type: string, x: number, y: number): PointerEvent {
      return new PointerEvent(type, { clientX: x, clientY: y, button: 0, pointerId: 1, bubbles: true });
    }

    beforeEach(() => {
      // The test host is a div, which :host(tsp-modal-window) does not match: cover the page like the real element
      fixture.nativeElement.style.cssText = 'position: fixed; inset: 0';
      fixture.componentRef.setInput('floating', true);
      fixture.componentRef.setInput('closable', true);
      fixture.componentRef.setInput('position', { w: 30, h: 20 });
      fixture.detectChanges();
    });

    it('sits at its position and lets clicks through around it', () => {
      const container: HTMLElement = query('.tsp-modal-window__container');
      expect(fixture.nativeElement.classList).toContain('tsp-modal-window--floating');
      expect([container.style.left, container.style.top]).toEqual(['30px', '20px']);
      expect(getComputedStyle(fixture.nativeElement).pointerEvents).toBe('none');
      expect(getComputedStyle(container).pointerEvents).toBe('auto');
    });

    it('is dragged by its title bar, keeping the title bar on the page', () => {
      const positions: Point[] = [];
      component.positionChange.subscribe((position) => positions.push(position));
      const titleBar: HTMLElement = query('.tsp-modal-window__title-bar');

      titleBar.dispatchEvent(pointer('pointerdown', 40, 25));
      titleBar.dispatchEvent(pointer('pointermove', 52, 30));
      titleBar.dispatchEvent(pointer('pointermove', 40, -100));
      titleBar.dispatchEvent(pointer('pointermove', 10000, 10000));

      const page: HTMLElement = fixture.nativeElement;
      expect(positions).toEqual([
        { w: 42, h: 25 },
        { w: 30, h: 0 },
        { w: page.clientWidth - 40, h: page.clientHeight - 18 },
      ]);
    });

    it('can still be closed with its close button', () => {
      let closed: number = 0;
      component.closeClicked.subscribe(() => closed++);
      const close: HTMLElement = query('.tsp-modal-window__close-button');
      close.dispatchEvent(pointer('pointerdown', 40, 25));
      close.click();
      expect(closed).toBe(1);
    });

    it('cannot be dragged when it is not floating', () => {
      fixture.componentRef.setInput('floating', false);
      fixture.detectChanges();
      const positions: Point[] = [];
      component.positionChange.subscribe((position) => positions.push(position));
      const titleBar: HTMLElement = query('.tsp-modal-window__title-bar');
      titleBar.dispatchEvent(pointer('pointerdown', 40, 25));
      titleBar.dispatchEvent(pointer('pointermove', 52, 30));
      expect(positions).toEqual([]);
      expect(query('.tsp-modal-window__container').style.left).toBe('');
    });
  });

  it('is not fullscreen, closable or iconed by default', () => {
    fixture.detectChanges();
    expect(query('.tsp-modal-window__container').classList.contains('tsp-modal-window__container--fullscreen')).toBe(
      false
    );
    expect(query('.tsp-modal-window__close-button')).toBeNull();
    expect(query('.tsp-modal-window__title-bar-icon')).toBeNull();
  });

  it('adds the fullscreen class when fullscreen is set', () => {
    fixture.componentRef.setInput('fullscreen', true);
    fixture.detectChanges();
    expect(query('.tsp-modal-window__container').classList.contains('tsp-modal-window__container--fullscreen')).toBe(
      true
    );
  });

  it('shows the paint icon when icon is "paint"', () => {
    fixture.componentRef.setInput('icon', 'paint');
    fixture.detectChanges();
    const icon: HTMLElement = query('.tsp-modal-window__title-bar-icon');
    expect(icon).not.toBeNull();
    expect(icon.classList.contains('tsp-modal-window__title-bar-icon--paint')).toBe(true);
  });

  it('removes the icon class again when the icon input is cleared', () => {
    fixture.componentRef.setInput('icon', 'paint');
    fixture.detectChanges();
    fixture.componentRef.setInput('icon', undefined);
    fixture.detectChanges();
    expect(query('.tsp-modal-window__title-bar-icon')).toBeNull();
    expect(component.iconClass).toEqual({});
  });

  it('shows a close button only when closable and emits closeClicked when it is clicked', () => {
    fixture.componentRef.setInput('closable', true);
    fixture.detectChanges();
    let clicks: number = 0;
    component.closeClicked.subscribe(() => clicks++);

    const button: HTMLElement = query('.tsp-modal-window__close-button');
    expect(button).not.toBeNull();
    button.click();

    expect(clicks).toBe(1);
  });

  it('projects its content below the title bar', () => {
    const content: HTMLParagraphElement = document.createElement('p');
    content.className = 'projected-content';
    content.textContent = 'Hello';
    const ref: ComponentRef<ModalWindowComponent> = createComponent(ModalWindowComponent, {
      environmentInjector: TestBed.inject(EnvironmentInjector),
      projectableNodes: [[content]],
    });
    ref.setInput('title', 'Projected');
    ref.changeDetectorRef.detectChanges();

    const element: HTMLElement = ref.location.nativeElement;
    const inner: HTMLElement = element.querySelector('.tsp-modal-window__inner-container');
    expect(inner.querySelector('.projected-content')).toBe(content);
    expect(inner.children[0].classList.contains('tsp-modal-window__title-bar')).toBe(true);
    expect(inner.children[1]).toBe(content);
    expect(element.querySelector('.tsp-can-grow').textContent.trim()).toBe('Projected');
    ref.destroy();
  });

  it('is centred on whole pixels, like a Windows dialog, even when its size is odd', () => {
    // Half-pixel positions make the pixel font blurry (or illegible without anti-aliasing)
    const content: HTMLDivElement = document.createElement('div');
    content.style.width = '301px';
    content.style.height = '77px';
    const ref: ComponentRef<ModalWindowComponent> = createComponent(ModalWindowComponent, {
      environmentInjector: TestBed.inject(EnvironmentInjector),
      projectableNodes: [[content]],
    });
    ref.setInput('title', 'Odd');
    document.body.appendChild(ref.location.nativeElement);
    ref.changeDetectorRef.detectChanges();

    const container: HTMLElement = ref.location.nativeElement.querySelector('.tsp-modal-window__container');
    const rect: DOMRect = container.getBoundingClientRect();
    expect(rect.width % 2, 'the test needs an odd width').toBe(1);
    expect(rect.height % 2, 'the test needs an odd height').toBe(1);
    expect(rect.left).toBe(Math.floor((window.innerWidth - rect.width) / 2));
    expect(rect.top).toBe(Math.floor((window.innerHeight - rect.height) / 2));
    ref.destroy();
  });
});
