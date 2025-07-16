import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextBarComponent } from './text-bar.component';

describe('TextBarComponent', () => {
  let component: TextBarComponent;
  let fixture: ComponentFixture<TextBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
