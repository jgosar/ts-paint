import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  AfterViewInit,
  OnInit,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ImageFileFormat } from '../../types/base/image-file-format';

@Component({
  selector: 'tsp-save-as-window',
  templateUrl: './save-as-window.component.html',
  styleUrls: ['./save-as-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SaveAsWindowComponent implements OnInit, AfterViewInit {
  readonly fileName = input.required<string>();
  readonly save = output<{ fileName: string; format: ImageFileFormat }>();
  readonly cancel = output<void>();

  private readonly _fileNameInput = viewChild<ElementRef<HTMLInputElement>>('fileNameInput');

  fileNameValue = signal('');
  format = signal<ImageFileFormat>('png');

  ngOnInit(): void {
    this.fileNameValue.set(this.fileName());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this._fileNameInput()?.nativeElement.select());
  }

  okClicked() {
    this.save.emit({ fileName: this.fileNameValue(), format: this.format() });
  }
}
