import { Component, OnInit, HostListener, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { TsPaintStore } from '../../services/ts-paint/ts-paint.store';
import { DrawingToolType } from '../../types/drawing-tools/drawing-tool-type';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil, map, distinctUntilChanged } from 'rxjs/operators';
import { Point } from 'src/app/types/base/point';

@Component({
  selector: 'tsp-ts-paint',
  templateUrl: './ts-paint.component.html',
  styleUrls: ['./ts-paint.component.less'],
})
export class TsPaintComponent implements OnInit, OnDestroy {
  @ViewChild('imageScroller', { static: true })
  imageScroller: ElementRef;

  private _ngUnsubscribe: Subject<void> = new Subject();
  private _scrollingHappened: Subject<Point> = new Subject<Point>();

  constructor(public store: TsPaintStore) {}

  ngOnInit(): void {
    this.store.setDrawingTool(DrawingToolType.line);

    this._scrollingHappened.pipe(debounceTime(400), takeUntil(this._ngUnsubscribe)).subscribe((scrollPosition) => {
      this.store.setScrollPosition(scrollPosition);
    });

    this.store.state$
      .pipe(
        map((state) => state.scrollPosition),
        distinctUntilChanged(),
        takeUntil(this._ngUnsubscribe)
      )
      .subscribe((scrollPosition) => {
        this.imageScroller.nativeElement.scrollLeft = scrollPosition.w;
        this.imageScroller.nativeElement.scrollTop = scrollPosition.h;
      });
  }

  ngOnDestroy(): void {
    this._ngUnsubscribe.next();
    this._ngUnsubscribe.complete();
  }

  onScroll(event: Event) {
    if (event.srcElement) {
      // @ts-ignore
      const scrollPosition: Point = { w: event.srcElement.scrollLeft, h: event.srcElement.scrollTop };
      this._scrollingHappened.next(scrollPosition);
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: any) {
    const pastedFile: File = event.clipboardData.items[0].getAsFile();

    this.store.pasteFile(pastedFile);
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    const executed: boolean = this.store.executeHotkeyAction(event);
    if (executed) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeunload(event: any) {
    if (this.store.state.unsavedChanges) {
      event.returnValue = true;
    }
  }
}
