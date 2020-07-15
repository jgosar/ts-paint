import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { getOsVersion } from 'src/app/helpers/environment.helpers';

@Component({
  selector: 'tsp-about-paint-window',
  templateUrl: './about-paint-window.component.html',
  styleUrls: ['./about-paint-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPaintWindowComponent {
  @Output()
  ok: EventEmitter<void> = new EventEmitter<void>();

  osVersion: string = getOsVersion();
}
