import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageBarComponent } from './image-bar.component';

describe('ImageBarComponent', () => {
  let component: ImageBarComponent;
  let fixture: ComponentFixture<ImageBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
