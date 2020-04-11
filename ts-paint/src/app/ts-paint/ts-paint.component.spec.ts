import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TsPaintComponent } from './ts-paint.component';

describe('TsPaintComponent', () => {
  let component: TsPaintComponent;
  let fixture: ComponentFixture<TsPaintComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TsPaintComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TsPaintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
