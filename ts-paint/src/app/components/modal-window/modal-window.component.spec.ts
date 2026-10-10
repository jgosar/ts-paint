import { ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalWindowComponent } from './modal-window.component';

describe('ModalWindowComponent', () => {
  let fixture: ComponentFixture<ModalWindowComponent>;
  let component: ModalWindowComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [ModalWindowComponent] }).compileComponents();
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
});
