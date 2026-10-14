import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  Input,
  Renderer2,
  AfterViewInit,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Point } from 'src/app/types/base/point';

@Component({
  selector: 'tsp-image-scroller',
  templateUrl: './image-scroller.component.html',
  styleUrls: ['./image-scroller.component.less'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class ImageScrollerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollerDiv', { static: true })
  scrollerDiv: ElementRef;

  private _scrollListener: () => void;
  private _isModelLocked: boolean = false;
  /** Bumped by every programmatic scroll; scroll events from before it report positions that no longer apply */
  private _scrollEpoch: number = 0;
  /** The position the model believes the viewport is at */
  private _scrollPosition: Point = { w: 0, h: 0 };

  constructor(private _element: ElementRef, private _renderer: Renderer2) {}

  @Input()
  public set scrollPosition(scrollPosition: Point) {
    this._scrollPosition = scrollPosition;
    setTimeout(() => {
      const element: HTMLElement = this._element.nativeElement;
      const before: Point = { w: element.scrollLeft, h: element.scrollTop };
      element.scrollLeft = scrollPosition.w;
      element.scrollTop = scrollPosition.h;
      this._scrollEpoch++;
      // The browser reports a programmatic scroll with a scroll event like any other, which must not come back as a
      // change. There is no event when nothing moved.
      this._isModelLocked = element.scrollLeft !== before.w || element.scrollTop !== before.h;
      this.reportIfOff(); // The browser clamps a position past the end of the image
    });
  }
  @Output()
  public scrollPositionChange: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  public viewportSizeChange: EventEmitter<Point> = new EventEmitter<Point>();

  private _ngUnsubscribe: Subject<void> = new Subject();
  private _viewportScrolled: Subject<{ position: Point; epoch: number }> = new Subject();
  private _viewportResized: Subject<Point> = new Subject<Point>();

  ngOnInit(): void {
    this._viewportScrolled.pipe(debounceTime(400), takeUntil(this._ngUnsubscribe)).subscribe((scrolled) => {
      // A position from before a programmatic scroll (e.g. a wheel scroll right before the magnifier zoomed) no
      // longer applies, and one the model already has is not a change
      if (scrolled.epoch === this._scrollEpoch && !pointsEqual(scrolled.position, this._scrollPosition)) {
        this.report(scrolled.position);
      }
    });
    this._viewportResized.pipe(debounceTime(400), takeUntil(this._ngUnsubscribe)).subscribe((viewportSize) => {
      this.viewportSizeChange.emit(viewportSize);
    });

    setTimeout(() => {
      this.onResize(); // Report initial viewport size
    });
  }

  ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
    this._scrollListener();
  }

  ngAfterViewInit(): void {
    this._scrollListener = this._renderer.listen(this._element.nativeElement, 'scroll', this.onScroll.bind(this));
  }

  onScroll(event: Event) {
    if (this._isModelLocked) {
      this._isModelLocked = false;
    } else {
      if (event.srcElement) {
        // @ts-ignore
        const position: Point = { w: event.srcElement.scrollLeft, h: event.srcElement.scrollTop };
        this._viewportScrolled.next({ position, epoch: this._scrollEpoch });
      }
    }
  }

  /** A touch gesture scrolls relative to the model's position, so the model must be up to date when it starts */
  @HostListener('touchstart')
  onTouchStart() {
    this.reportIfOff();
  }

  @HostListener('window:resize')
  onResize() {
    // @ts-ignore
    const viewportSize: Point = {
      w: this._element.nativeElement.clientWidth,
      h: this._element.nativeElement.clientHeight,
    };
    this._viewportResized.next(viewportSize);
  }

  /** Reports the actual position when the model's is off by a pixel or more, e.g. after a clamped scroll */
  private reportIfOff() {
    const element: HTMLElement = this._element.nativeElement;
    const actual: Point = { w: element.scrollLeft, h: element.scrollTop };
    // Fractional scroll offsets (see PixelScalingService) are not worth a change
    if (Math.abs(actual.w - this._scrollPosition.w) >= 1 || Math.abs(actual.h - this._scrollPosition.h) >= 1) {
      this.report(actual);
    }
  }

  private report(scrollPosition: Point) {
    this._scrollPosition = scrollPosition;
    this.scrollPositionChange.emit(scrollPosition);
  }
}

function pointsEqual(a: Point, b: Point): boolean {
  return a.w === b.w && a.h === b.h;
}
