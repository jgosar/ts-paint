import { OpenFileAction } from './open-file-action';
import { TsPaintStoreState } from '../../services/ts-paint/ts-paint.store.state';
import { createTestState } from '../../../testing/state.factory';
import { imageFromMask } from '../../../testing/image-test.helpers';
import { classesOf, executeAndUndo, imagesEqual } from '../../../testing/action-test.helpers';

const FILE_HANDLE: FileSystemFileHandle = ({ name: 'photo.jpg' } as unknown) as FileSystemFileHandle;

function openPhoto(): OpenFileAction {
  return new OpenFileAction({
    imageData: imageFromMask(['#.', '.#']),
    fileName: 'photo',
    fileFormat: 'jpeg',
    fileHandle: FILE_HANDLE,
  });
}

describe('OpenFileAction', () => {
  it('replaces the image and the file details without marking the image as changed', () => {
    const state: TsPaintStoreState = createTestState();
    const action: OpenFileAction = openPhoto();

    const patches: Partial<TsPaintStoreState> = action.getStatePatches(state);

    expect(patches.image).toBe(action.fileData.imageData);
    expect(patches.fileName).toBe('photo');
    expect(patches.fileFormat).toBe('jpeg');
    expect(patches.fileHandle).toBe(FILE_HANDLE);
    expect(patches.unsavedChanges).toBe(false);
    expect(action.replacesImage).toBe(true);
    expect(action.deselectsSelection).toBe(true);
  });

  it('undoes by opening the previous file state again', () => {
    const state: TsPaintStoreState = createTestState();
    const action: OpenFileAction = openPhoto();

    const restored: TsPaintStoreState = executeAndUndo(action, state);

    expect(classesOf(action.undoActions)).toEqual([OpenFileAction]);
    expect(imagesEqual(restored.image, state.image)).toBe(true);
    expect(restored.fileName).toBe('untitled');
    expect(restored.fileFormat).toBe('png');
    expect(restored.fileHandle).toBeUndefined();
  });
});
