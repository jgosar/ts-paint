import {
  Component,
  ChangeDetectionStrategy,
  AfterViewInit,
  OnInit,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  DEFAULT_IMAGE_FILE_FORMAT,
  IMAGE_FILE_FORMAT_INFO,
  IMAGE_FILE_FORMATS,
  ImageFileFormat,
} from '../../types/base/image-file-format';
import { DropdownOption } from '../../types/base/dropdown-option';
import { TextInputComponent } from '../inputs/text-input/text-input.component';

const FORMAT_OPTIONS: DropdownOption<ImageFileFormat>[] = IMAGE_FILE_FORMATS.map((format) => ({
  value: format,
  label: IMAGE_FILE_FORMAT_INFO[format].label,
}));

@Component({
  selector: 'tsp-save-as-window',
  templateUrl: './save-as-window.component.html',
  styleUrls: ['./save-as-window.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SaveAsWindowComponent implements OnInit, AfterViewInit {
  readonly fileName = input.required<string>();
  readonly fileFormat = input.required<ImageFileFormat>();
  readonly save = output<{ fileName: string; format: ImageFileFormat }>();
  readonly cancel = output<void>();

  private readonly _fileNameInput = viewChild<TextInputComponent>('fileNameInput');

  fileNameValue = signal('');
  format = signal<ImageFileFormat>(DEFAULT_IMAGE_FILE_FORMAT);
  readonly formatOptions = FORMAT_OPTIONS;

  ngOnInit(): void {
    this.fileNameValue.set(this.fileName());
    this.format.set(this.fileFormat());
  }

  ngAfterViewInit(): void {
    this._fileNameInput()?.focus();
  }

  okClicked() {
    const fileName: string = this.fileNameValue().trim();
    if (fileName === '') {
      this._fileNameInput()?.focus();
      return;
    }
    this.save.emit({ fileName, format: this.format() });
  }
}
