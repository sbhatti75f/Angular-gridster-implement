import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageAreaComponent } from './image-area.component';

describe('ImageAreaComponent', () => {
  let component: ImageAreaComponent;
  let fixture: ComponentFixture<ImageAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageAreaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
