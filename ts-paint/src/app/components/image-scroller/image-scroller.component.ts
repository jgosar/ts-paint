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
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Point } from 'src/app/types/base/point';

@Component({
  selector: 'tsp-image-scroller',
  templateUrl: './image-scroller.component.html',
  styleUrls: ['./image-scroller.component.less'],
})
export class ImageScrollerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollerDiv', { static: true })
  scrollerDiv: ElementRef;

  private _scrollListener: () => void;

  constructor(private _element: ElementRef, private _renderer: Renderer2) {}

  @Input()
  public set scrollPosition(scrollPosition: Point) {
    this._element.nativeElement.scrollLeft = scrollPosition.w;
    this._element.nativeElement.scrollTop = scrollPosition.h;
  }
  @Output()
  public scrollPositionChange: EventEmitter<Point> = new EventEmitter<Point>();
  @Output()
  public viewportSizeChange: EventEmitter<Point> = new EventEmitter<Point>();

  private _ngUnsubscribe: Subject<void> = new Subject();
  private _viewportScrolled: Subject<Point> = new Subject<Point>();
  private _viewportResized: Subject<Point> = new Subject<Point>();

  ngOnInit(): void {
    this._viewportScrolled.pipe(debounceTime(400), takeUntil(this._ngUnsubscribe)).subscribe((scrollPosition) => {
      this.scrollPositionChange.emit(scrollPosition);
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
    if (event.srcElement) {
      // @ts-ignore
      const scrollPosition: Point = { w: event.srcElement.scrollLeft, h: event.srcElement.scrollTop };
      this._viewportScrolled.next(scrollPosition);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // @ts-ignore
    const viewportSize: Point = {
      w: this._element.nativeElement.clientWidth,
      h: this._element.nativeElement.clientHeight,
    };
    this._viewportResized.next(viewportSize);
  }
}
