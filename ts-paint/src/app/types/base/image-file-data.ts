import { ImageFileFormat } from './image-file-format';

export interface ImageFileData {
  imageData: ImageData;
  fileName: string;
  fileFormat: ImageFileFormat;
  fileHandle?: FileSystemFileHandle;
}
