import { PromiseParams } from './promise-params';

export interface PasteFileParams extends PromiseParams<ImageData> {
  pastedFile: File
}
