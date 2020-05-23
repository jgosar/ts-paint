import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { MenuItem } from '../../types/menu/menu-item';

@Component({
  selector: 'tsp-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  @Input()
  menuStructure: MenuItem[];
  @Output()
  itemSelected: EventEmitter<MenuItem> = new EventEmitter<MenuItem>();

  constructor(private _element: ElementRef) {
    _element.nativeElement.setAttribute('tabindex', '-1'); // This makes the menu parent focusable
  }

  focusMenu() {
    this._element.nativeElement.focus();
  }
}
