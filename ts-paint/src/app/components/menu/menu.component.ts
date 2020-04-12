import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { MenuItem } from 'src/app/types/menu/menu-item';

@Component({
  selector: 'tsp-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {
  @Input()
  menuStructure: MenuItem[];
  @Output()
  itemSelected: EventEmitter<MenuItem> = new EventEmitter<MenuItem>();
}
