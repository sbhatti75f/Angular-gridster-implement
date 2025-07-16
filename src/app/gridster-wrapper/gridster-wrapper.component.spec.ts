import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GridsterWrapperComponent } from './gridster-wrapper.component';

describe('GridsterWrapperComponent', () => {
  let component: GridsterWrapperComponent;
  let fixture: ComponentFixture<GridsterWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GridsterWrapperComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GridsterWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
