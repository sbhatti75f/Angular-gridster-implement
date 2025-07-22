import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-image-area',
  templateUrl: './image-area.component.html',
  styleUrls: ['./image-area.component.scss']
})
export class ImageAreaComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() imageUrl: string = '';
  @Input() imageLink: string = '';
  @Input() imageId!: number;

  @Output() focusChanged = new EventEmitter<boolean>();
  @Output() imageElementRefOutput = new EventEmitter<{ id: number, elementRef: ElementRef }>();

  fallbackImg = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

  // Correct name to `imageRef`, not `imageElementRef`
  @ViewChild('imageRef', { static: false }) imageRef!: ElementRef<HTMLImageElement>;
  @ViewChild('imageContainer', { static: false }) imageContainerRef!: ElementRef;

  private observer!: MutationObserver;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] && this.imageRef?.nativeElement) {
      this.imageElementRefOutput.emit({
        id: this.imageId,
        elementRef: this.imageRef
      });
    }
  }

  ngAfterViewInit(): void {
    this.emitImageRef();

    if (this.imageContainerRef?.nativeElement) {
      this.observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            setTimeout(() => {
              if (this.imageRef) {
                this.emitImageRef();
              } else {
                const imgEl = this.imageContainerRef.nativeElement.querySelector('.displayed-image');
                if (imgEl && this.imageId !== undefined) {
                  this.imageElementRefOutput.emit({
                    id: this.imageId,
                    elementRef: new ElementRef(imgEl)
                  });
                }
              }
            });
            break;
          }
        }
      });

      this.observer.observe(this.imageContainerRef.nativeElement, {
        attributes: true,
        childList: true,
        subtree: true
      });
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private emitImageRef() {
    if (this.imageRef && this.imageId !== undefined) {
      this.imageElementRefOutput.emit({
        id: this.imageId,
        elementRef: this.imageRef
      });
    }
  }

  openLink(event: Event) {
    if (this.imageLink) {
      window.open(this.imageLink, '_blank');
    }
  }

  onFocus() {
    this.focusChanged.emit(true);
  }

  onBlur() {
    this.focusChanged.emit(false);
  }
}
