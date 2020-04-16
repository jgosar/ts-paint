import { TsPaintAction } from '../ts-paint-action';
import { TsPaintActionType } from '../ts-paint-action-type';
import { ImageFileData } from '../../base/image-file-data';

export interface OpenFileAction extends TsPaintAction {
  image: ImageData,
  fileName: string
}

export function createOpenFileAction(fileData: ImageFileData): OpenFileAction {
  return { type: TsPaintActionType.OPEN_FILE, renderIn: 'image', image: fileData.imageData, fileName: fileData.fileName };
}