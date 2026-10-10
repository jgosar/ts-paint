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
