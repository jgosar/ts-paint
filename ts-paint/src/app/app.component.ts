import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'tsp-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {
  title = 'ts-paint';
}
