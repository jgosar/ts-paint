import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RadioButtonGroupComponent } from './radio-button-group.component';
import { RadioButtonOption } from './radio-button-option';

const OPTIONS: RadioButtonOption<string>[] = [
  { value: 'a', name: 'Alpha' },
  { value: 'b', name: 'Beta' },
  { value: 'c', name: 'Gamma' },
];

describe('RadioButtonGroupComponent', () => {
  let fixture: ComponentFixture<RadioButtonGroupComponent>;
  let component: RadioButtonGroupComponent;
  let emitted: RadioButtonOption<string>[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RadioButtonGroupComponent],
      imports: [FormsModule],
    }).compileComponents();
    fixture = createFixture();
    component = fixture.componentInstance;
    emitted = [];
    component.selectedOptionChange.subscribe((option) => emitted.push(option));
  });

  function createFixture(): ComponentFixture<RadioButtonGroupComponent> {
    return TestBed.createComponent(RadioButtonGroupComponent);
  }

  async function render(
    target: ComponentFixture<RadioButtonGroupComponent>,
    selected: RadioButtonOption<string> = OPTIONS[0],
    disabled: boolean = false
  ) {
    target.componentRef.setInput('options', OPTIONS);
    target.componentRef.setInput('selectedOption', selected);
    target.componentRef.setInput('disabled', disabled);
    target.detectChanges();
    await target.whenStable(); // ngModel writes the checked state asynchronously
  }

  function radios(target: ComponentFixture<RadioButtonGroupComponent> = fixture): HTMLInputElement[] {
    return Array.from(target.nativeElement.querySelectorAll('input[type="radio"]'));
  }

  function labels(): HTMLLabelElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('label'));
  }

  it('renders a radio button with a label for each option', async () => {
    await render(fixture);
    expect(radios().length).toBe(3);
    expect(labels().map((l) => l.textContent.trim())).toEqual(['Alpha', 'Beta', 'Gamma']);
    radios().forEach((radio, i) => expect(labels()[i].htmlFor, `label ${i} targets its radio`).toBe(radio.id));
    expect(new Set(radios().map((r) => r.id)).size, 'ids are unique').toBe(3);
  });

  it('puts all radios in one group whose name differs between instances', async () => {
    await render(fixture);
    const other: ComponentFixture<RadioButtonGroupComponent> = createFixture();
    await render(other);
    expect(component.groupName).toMatch(/^RadioButtonGroup\d+$/);
    expect(other.componentInstance.groupName).not.toBe(component.groupName);
    expect(radios().every((r) => r.id.startsWith(component.groupName + '-'))).toBe(true);
    // The group name only reaches Angular's radio registry: `name="{{ groupName }}"` is claimed by the ngModel /
    // radio accessor `name` inputs, so no name attribute is rendered and the radios are grouped by Angular alone.
    expect(radios().map((r) => r.getAttribute('name'))).toEqual([null, null, null]);
    expect(radios(other).map((r) => r.getAttribute('name'))).toEqual([null, null, null]);
  });

  it('checks the radio of the selected option', async () => {
    await render(fixture, OPTIONS[1]);
    expect(radios().map((r) => r.checked)).toEqual([false, true, false]);
  });

  it('emits the clicked option and leaves the selection to the parent', async () => {
    await render(fixture);
    radios()[2].click();
    expect(emitted).toEqual([OPTIONS[2]]);
    expect(emitted[0]).toBe(OPTIONS[2]);
    expect(component.selectedOption).toBe(OPTIONS[0]);
  });

  it('disables the radios and their labels when disabled', async () => {
    await render(fixture, OPTIONS[0], true);
    expect(radios().every((r) => r.hasAttribute('disabled'))).toBe(true);
    expect(labels().every((l) => l.hasAttribute('disabled'))).toBe(true);
    await render(fixture, OPTIONS[0], false);
    expect(radios().some((r) => r.hasAttribute('disabled'))).toBe(false);
    expect(labels().some((l) => l.hasAttribute('disabled'))).toBe(false);
  });
});
