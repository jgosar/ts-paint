import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { MenuItem } from '../../types/menu/menu-item';

/** A menu item prepared for the template, with its hotkey label built once */
export interface MenuEntry {
  item: MenuItem;
  hotkeyLabel?: string;
  menus?: MenuEntry[];
}

function toMenuEntry(item: MenuItem): MenuEntry {
  return {
    item,
    hotkeyLabel: item.hotkeys?.join('+'),
    menus: item.menus?.map(toMenuEntry),
  };
}

@Component({
  selector: 'tsp-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MenuComponent implements OnChanges {
  @Input()
  menuStructure: MenuItem[];
  @Output()
  itemSelected: EventEmitter<MenuItem> = new EventEmitter<MenuItem>();

  entries: MenuEntry[] = [];

  constructor(private _element: ElementRef) {
    _element.nativeElement.setAttribute('tabindex', '-1'); // This makes the menu parent focusable
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.entries = (this.menuStructure ?? []).map(toMenuEntry);
  }

  focusMenu() {
    this._element.nativeElement.focus();
  }

  selectItem(item: MenuItem) {
    if (!item.disabled) {
      this.itemSelected.emit(item);
    }
  }
}
