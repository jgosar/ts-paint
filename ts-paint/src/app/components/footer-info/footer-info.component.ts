import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Point } from 'src/app/types/base/point';

@Component({
  selector: 'tsp-footer-info',
  templateUrl: './footer-info.component.html',
  styleUrls: ['./footer-info.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterInfoComponent {
  @Input()
  helpText: string;
  @Input()
  shapeStart: Point;
  @Input()
  shapeDimensions: Point;
}
