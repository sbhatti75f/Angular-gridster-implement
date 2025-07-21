import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';

@Component({
  selector: 'app-image-area',
  templateUrl: './image-area.component.html',
  styleUrls: ['./image-area.component.scss']
})
export class ImageAreaComponent implements AfterViewInit {
  @Input() imageUrl: string = '';
  @Output() focusChanged = new EventEmitter<boolean>();
  @Output() imageRef = new EventEmitter<ElementRef>();

  @ViewChild('imageRef') imageElementRef!: ElementRef;

  ngAfterViewInit(): void {
    this.imageRef.emit(this.imageElementRef);
  }

  onFocus() {
    this.focusChanged.emit(true);
  }

  onBlur() {
    this.focusChanged.emit(false);
  }
}
