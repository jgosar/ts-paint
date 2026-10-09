import { recordKeys } from '../../helpers/typescript.helpers';

export type ImageFileFormat = 'png' | 'jpeg';

export interface ImageFileFormatInfo {
  label: string; // Shown in the Save As dropdown
  description: string; // Shown in the native file picker's type list
  extension: string; // Extension used when saving
  extensions: string[]; // All extensions recognised as this format (lower case, without the dot)
  mimeType: string;
  quality?: number;
}

// Single source of truth for everything format-specific. Being a Record over ImageFileFormat, adding a new
// format to the type without adding an entry here is a compile error, and all lists below derive from it.
export const IMAGE_FILE_FORMAT_INFO: Record<ImageFileFormat, ImageFileFormatInfo> = {
  png: { label: 'PNG', description: 'PNG image', extension: 'png', extensions: ['png'], mimeType: 'image/png' },
  jpeg: {
    label: 'JPEG',
    description: 'JPEG image',
    extension: 'jpg',
    extensions: ['jpg', 'jpeg'],
    mimeType: 'image/jpeg',
    quality: 0.9,
  },
};

export const IMAGE_FILE_FORMATS: ImageFileFormat[] = recordKeys(IMAGE_FILE_FORMAT_INFO);

export const DEFAULT_IMAGE_FILE_FORMAT: ImageFileFormat = 'png';
