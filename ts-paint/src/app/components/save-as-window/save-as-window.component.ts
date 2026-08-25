import { Component, ChangeDetectionStrategy, AfterViewInit, OnInit, input, output, signal, viewChild } from '@angular/core';
import { ImageFileFormat } from '../../types/base/image-file-format';
import { DropdownOption } from '../../types/base/dropdown-option';
import { TextInputComponent } from '../inputs/text-input/text-input.component';

const FORMAT_OPTIONS: DropdownOption<ImageFileFormat>[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
];

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

  private readonly _fileNameInput = viewChild<TextInputComponent>('fileNameInput');

  fileNameValue = signal('');
  format = signal<ImageFileFormat>('png');
  readonly formatOptions = FORMAT_OPTIONS;

  ngOnInit(): void {
    this.fileNameValue.set(this.fileName());
  }

  ngAfterViewInit(): void {
    this._fileNameInput()?.focus();
  }

  okClicked() {
    this.save.emit({ fileName: this.fileNameValue(), format: this.format() });
  }
}
