import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { MenuItem } from 'src/app/types/menu/menu-item';
import { TsPaintStore } from 'src/app/services/ts-paint/ts-paint.store';

@Component({
  selector: 'tsp-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {
  @Input()
  public menuStructure: MenuItem[];

  constructor(public store: TsPaintStore) {

  }
}
