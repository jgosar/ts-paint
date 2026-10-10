import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AboutPaintWindowComponent } from './about-paint-window.component';
import { ModalWindowComponent } from '../modal-window/modal-window.component';
import { keyup } from '../../../testing/events';

const WINDOWS_10_USER_AGENT: string =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const MAC_USER_AGENT: string =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

describe('AboutPaintWindowComponent', () => {
  let fixture: ComponentFixture<AboutPaintWindowComponent>;
  let okCount: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AboutPaintWindowComponent, ModalWindowComponent],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  /** The OS is read from the user agent when the component is constructed, so it is stubbed before creating it */
  function render(userAgent: string = WINDOWS_10_USER_AGENT) {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    fixture = TestBed.createComponent(AboutPaintWindowComponent);
    okCount = 0;
    fixture.componentInstance.ok.subscribe(() => okCount++);
    fixture.detectChanges();
  }

  function infoText(): string {
    return fixture.nativeElement.querySelector('.tsp-about-paint-window__info-container').textContent;
  }

  it('shows the OS version detected from the user agent', () => {
    render(WINDOWS_10_USER_AGENT);
    expect(fixture.nativeElement.querySelector('.tsp-modal-window__title-bar').textContent.trim()).toBe('About Paint');
    expect(infoText()).toContain('TS Paint');
    expect(infoText()).toContain('Windows 10');
    expect(infoText()).not.toContain('Mac OS');
  });

  it('detects other operating systems too', () => {
    render(MAC_USER_AGENT);
    expect(infoText()).toContain('Mac OS X');
    expect(infoText()).not.toContain('Windows');
  });

  it('links to the source code', () => {
    render();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(link.href).toBe('https://github.com/jgosar/ts-paint');
    expect(link.target).toBe('_blank');
  });

  it('emits ok on the OK button, Enter, Escape and the title bar X', () => {
    render();
    fixture.nativeElement.querySelector('button.tsp-text-button').click();
    expect(okCount).toBe(1);
    fixture.nativeElement.querySelector('.tsp-about-paint-window__container').dispatchEvent(keyup('Enter'));
    expect(okCount).toBe(2);
    fixture.nativeElement.querySelector('.tsp-about-paint-window__container').dispatchEvent(keyup('Escape'));
    expect(okCount).toBe(3);
    fixture.nativeElement.querySelector('.tsp-modal-window__close-button').click();
    expect(okCount).toBe(4);
  });
});
