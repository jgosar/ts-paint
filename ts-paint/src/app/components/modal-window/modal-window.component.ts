import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { Point } from '../../types/base/point';

/** How much of a floating window has to stay on the page, so that its title bar can always be grabbed again */
const VISIBLE_PART: Point = { w: 40, h: 18 };

@Component({
  selector: 'tsp-modal-window',
  templateUrl: './modal-window.component.html',
  styleUrls: ['./modal-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ModalWindowComponent implements OnChanges {
  @Input()
  title: string;
  @Input()
  fullscreen: boolean = false;
  @Input()
  closable: boolean = false;
  @Input()
  icon: 'paint' | undefined;
  /** A tool window (like the Fonts toolbar): it does not block the rest of the app, sits at `position` and can be
   * dragged by its title bar */
  @Input()
  @HostBinding('class.tsp-modal-window--floating')
  floating: boolean = false;
  /** The top left corner of a floating window, in css px from the top left of the page */
  @Input()
  position: Point = { w: 0, h: 0 };
  @Output()
  closeClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output()
  positionChange: EventEmitter<Point> = new EventEmitter<Point>();

  iconClass: any;

  @ViewChild('container', { static: true })
  private _container: ElementRef<HTMLElement>;
  private _dragStartPosition: Point;

  constructor(private _element: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    if (this.icon === 'paint') {
      this.iconClass = { 'tsp-modal-window__title-bar-icon--paint': true };
    } else {
      this.iconClass = {};
    }
  }

  startDrag() {
    this._dragStartPosition = this.position;
  }

  drag(delta: Point) {
    // The host covers the page, so its size is the room the window can move in
    const page: HTMLElement = this._element.nativeElement;
    const width: number = this._container.nativeElement.offsetWidth;
    const w: number = Math.round(this._dragStartPosition.w + delta.w);
    const h: number = Math.round(this._dragStartPosition.h + delta.h);
    this.positionChange.emit({
      w: Math.min(Math.max(w, VISIBLE_PART.w - width), page.clientWidth - VISIBLE_PART.w),
      h: Math.min(Math.max(h, 0), page.clientHeight - VISIBLE_PART.h),
    });
  }
}
