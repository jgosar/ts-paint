import { Injectable } from '@angular/core';
import { TsPaintStoreState } from './ts-paint.store.state';
import { Store } from 'rxjs-observable-store';
import { MenuAction } from 'src/app/types/menu-action';
import { assertUnreachable } from 'src/app/helpers/typescript.helpers';

@Injectable()
export class TsPaintStore extends Store<TsPaintStoreState>{
  constructor() {
    super(new TsPaintStoreState());
  }

  executeMenuAction(menuAction: MenuAction) {
    const menuActionFunction: () => void = this.getMenuActionFunction(menuAction);
    menuActionFunction();
  }

  private getMenuActionFunction(menuAction: MenuAction): () => void {
    switch (menuAction) {
      case MenuAction.OPEN_FILE: return this.openFile.bind(this);
      case MenuAction.SAVE_FILE: return this.saveFile.bind(this);
      case MenuAction.UNDO: return this.undo.bind(this);
      case MenuAction.REPEAT: return this.repeat.bind(this);
      case MenuAction.CLEAR_IMAGE: return this.clearImage.bind(this);
    }

    assertUnreachable(menuAction);
  }

  private openFile() {

  }

  private saveFile() {

  }

  private undo() {

  }

  private repeat() {

  }

  private clearImage() {

  }
}