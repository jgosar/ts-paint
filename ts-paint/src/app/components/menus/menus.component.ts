import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { MenuItem } from 'src/app/types/menu-item';
import { TsPaintStore } from 'src/app/services/ts-paint/ts-paint.store';

@Component({
  selector: 'tsp-menus',
  templateUrl: './menus.component.html',
  styleUrls: ['./menus.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenusComponent {
  @Input()
  public menuStructure: MenuItem[];

  constructor(public store: TsPaintStore) {

  }
}
