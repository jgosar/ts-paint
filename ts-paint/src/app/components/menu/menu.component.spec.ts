import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent } from './menu.component';
import { MenuItem } from '../../types/menu/menu-item';
import { MenuActionType } from '../../types/menu/menu-action-type';

describe('MenuComponent', () => {
  let fixture: ComponentFixture<MenuComponent>;
  let component: MenuComponent;
  const newItem: MenuItem = { name: 'New', hotkeys: ['Ctrl', 'N'], action: MenuActionType.NEW };
  const saveItem: MenuItem = { name: 'Save', disabled: true, hotkeys: ['Ctrl', 'S'], action: MenuActionType.SAVE_FILE };
  const openItem: MenuItem = { name: 'Open...', disabled: false, action: MenuActionType.OPEN_FILE };
  const menuStructure: MenuItem[] = [
    { name: 'File', menus: [newItem, {}, openItem, saveItem] },
    { name: 'Edit', menus: [{ name: 'Undo' }] },
    { name: 'Help' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [MenuComponent] }).compileComponents();
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('menuStructure', menuStructure);
    fixture.detectChanges();
  });

  function level1(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.tsp-menu__menu-level-1'));
  }

  function level2(menu: HTMLElement): HTMLElement[] {
    return Array.from(menu.querySelectorAll('.tsp-menu__menu-level-2'));
  }

  function textOf(element: HTMLElement): string {
    return element.firstElementChild.textContent.trim();
  }

  it('renders the top-level menu names in order', () => {
    const names: string[] = level1().map((menu) => menu.firstChild.textContent.trim());
    expect(names).toEqual(['File', 'Edit', 'Help']);
  });

  it('renders no second-level container for a top-level item without sub-menus', () => {
    expect(level1()[2].querySelector('.tsp-menu__menu-level-2-container')).toBeNull();
    expect(level1()[0].querySelector('.tsp-menu__menu-level-2-container')).not.toBeNull();
  });

  it('renders the named second-level items and an <hr> for an empty separator item', () => {
    const container: HTMLElement = level1()[0].querySelector('.tsp-raised-item');
    expect(level2(container).map(textOf)).toEqual(['New', 'Open...', 'Save']);
    const children: Element[] = Array.from(container.children);
    expect(children.map((child) => child.tagName)).toEqual(['DIV', 'HR', 'DIV', 'DIV']);
  });

  it('marks only disabled items with the disabled class', () => {
    const items: HTMLElement[] = level2(level1()[0]);
    expect(items.map((item) => item.classList.contains('tsp-menu__menu-level-2--disabled'))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it('shows the hotkeys joined with "+" and no hotkey element for items without hotkeys', () => {
    const items: HTMLElement[] = level2(level1()[0]);
    expect(items[0].querySelector('.tsp-menu__menu-item-hotkeys').textContent.trim()).toBe('Ctrl+N');
    expect(items[2].querySelector('.tsp-menu__menu-item-hotkeys').textContent.trim()).toBe('Ctrl+S');
    expect(items[1].querySelector('.tsp-menu__menu-item-hotkeys')).toBeNull();
  });

  it('emits the clicked item when it is enabled', () => {
    const emitted: MenuItem[] = [];
    component.itemSelected.subscribe((item) => emitted.push(item));

    level2(level1()[0])[0].click();
    level2(level1()[0])[1].click();

    expect(emitted).toEqual([newItem, openItem]);
  });

  it('does not emit when a disabled item is clicked', () => {
    const emitted: MenuItem[] = [];
    component.itemSelected.subscribe((item) => emitted.push(item));

    level2(level1()[0])[2].click();

    expect(emitted).toEqual([]);
  });

  it('shows a check mark only in front of checked items, and marks checkable items for assistive technology', () => {
    fixture.componentRef.setInput('menuStructure', [
      { name: 'Options', menus: [{ name: 'On', checked: true }, { name: 'Off', checked: false }, { name: 'Plain' }] },
    ]);
    fixture.detectChanges();

    const items: HTMLElement[] = level2(level1()[0]);
    expect(items.map((item) => item.querySelector('.tsp-menu__check') !== null)).toEqual([true, false, false]);
    expect(items.map((item) => item.getAttribute('role'))).toEqual([
      'menuitemcheckbox',
      'menuitemcheckbox',
      'menuitem',
    ]);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', null]);
    expect(textOf(items[0]), 'the name follows the check mark').toBe('');
    expect(items[0].children[1].textContent.trim()).toBe('On');
  });

  describe('with a submenu', () => {
    const gridItem: MenuItem = { name: 'Show Grid', hotkeys: ['Ctrl', 'G'], checked: true, action: MenuActionType.CROP };
    const thumbnailItem: MenuItem = { name: 'Show Thumbnail', disabled: true, action: MenuActionType.CUT };
    const zoomItem: MenuItem = { name: 'Zoom', menus: [{ name: 'Custom...', disabled: true }, {}, gridItem, thumbnailItem] };

    beforeEach(() => {
      fixture.componentRef.setInput('menuStructure', [{ name: 'View', menus: [{ name: 'Status Bar' }, zoomItem] }]);
      fixture.detectChanges();
    });

    function level3(item: HTMLElement): HTMLElement[] {
      return Array.from(item.querySelectorAll('.tsp-menu__menu-level-3'));
    }

    function zoom(): HTMLElement {
      return level2(level1()[0])[1];
    }

    it('renders the submenu inside its second-level item, with an arrow pointing at it', () => {
      expect(level2(level1()[0]).map(textOf)).toEqual(['Status Bar', 'Zoom']);
      expect(level3(zoom()).map(textOf)).toEqual(['Custom...', '', 'Show Thumbnail']);
      expect(zoom().querySelector('.tsp-menu__menu-level-3-container hr')).not.toBeNull();
      expect(zoom().querySelector(':scope > .tsp-menu__arrow')).not.toBeNull();
      expect(zoom().getAttribute('aria-haspopup')).toBe('true');
    });

    it('renders no arrow or submenu for an item without sub-menus', () => {
      const statusBar: HTMLElement = level2(level1()[0])[0];
      expect(statusBar.querySelector('.tsp-menu__arrow')).toBeNull();
      expect(statusBar.querySelector('.tsp-menu__menu-level-3-container')).toBeNull();
      expect(statusBar.getAttribute('aria-haspopup')).toBeNull();
    });

    it('shows check marks, hotkeys and the disabled state of submenu items', () => {
      const [custom, grid, thumbnail] = level3(zoom());
      expect(grid.querySelector('.tsp-menu__check')).not.toBeNull();
      expect(grid.getAttribute('aria-checked')).toBe('true');
      expect(grid.querySelector('.tsp-menu__menu-item-hotkeys').textContent.trim()).toBe('Ctrl+G');
      expect(custom.querySelector('.tsp-menu__check')).toBeNull();
      expect(
        [custom, grid, thumbnail].map((item) => item.classList.contains('tsp-menu__menu-level-3--disabled'))
      ).toEqual([true, false, true]);
    });

    it('emits a clicked submenu item, and only that', () => {
      const emitted: MenuItem[] = [];
      component.itemSelected.subscribe((item) => emitted.push(item));

      level3(zoom())[1].click();

      expect(emitted).toEqual([gridItem]);
    });

    it('does not emit when a disabled submenu item or the item holding the submenu is clicked', () => {
      const emitted: MenuItem[] = [];
      component.itemSelected.subscribe((item) => emitted.push(item));

      level3(zoom())[2].click();
      zoom().click();

      expect(emitted).toEqual([]);
    });

    it('opens the submenu next to the hovered item, level with it, while the menu has focus', () => {
      const container: HTMLElement = zoom().querySelector('.tsp-menu__menu-level-3-container');
      expect(getComputedStyle(container).display).toBe('none');
      expect(getComputedStyle(container).position).toBe('absolute');
    });
  });

  it('makes the host focusable with tabindex -1', () => {
    expect(fixture.nativeElement.getAttribute('tabindex')).toBe('-1');
  });

  it('focuses the host element with focusMenu()', () => {
    expect(document.activeElement).not.toBe(fixture.nativeElement);
    component.focusMenu();
    expect(document.activeElement).toBe(fixture.nativeElement);
  });

  it('focuses the host when a top-level menu is clicked', () => {
    level1()[1].click();
    expect(document.activeElement).toBe(fixture.nativeElement);
  });
});
