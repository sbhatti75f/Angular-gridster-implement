import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';

@Component({
  selector: 'app-image-bar',
  templateUrl: './image-bar.component.html',
  styleUrls: ['./image-bar.component.scss'],
})
export class ImageBarComponent {
  @Input() imageRef!: ElementRef; // This Input will now receive the ElementRef of the <img> tag
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() imageReplaced = new EventEmitter<string>();
  @Output() requestElementRefRefresh = new EventEmitter<void>(); // Add this

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  @Output() linkAdded = new EventEmitter<string>();

  @Output() replaceImageRequested = new EventEmitter<void>();

  triggerFileReplace() {
    this.replaceImageRequested.emit();
  }

  addLinkToImage() {
    const url = prompt('Enter link URL:');
    if (url) {
      let finalUrl = url.trim();
      if (!/^(https?:\/\/|mailto:|tel:)/i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }
      this.linkAdded.emit(finalUrl);
    }
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}