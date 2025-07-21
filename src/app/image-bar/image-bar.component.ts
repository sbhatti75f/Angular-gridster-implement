import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef
} from '@angular/core';

@Component({
  selector: 'app-image-bar',
  templateUrl: './image-bar.component.html',
  styleUrls: ['./image-bar.component.css']
})
export class ImageBarComponent {
  @Input() imageRef!: ElementRef; // comes from image-area
  @Output() deleteClicked = new EventEmitter<void>();
  @Output() imageReplaced = new EventEmitter<string>();

  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  // Trigger file selection for replacing
  triggerFileReplace() {
    this.fileInputRef.nativeElement.click();
  }

  // Replace logic
  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.imageReplaced.emit(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }

  // Linking logic
  addLinkToImage() {
    const url = prompt('Enter link URL:');
    if (url && this.imageRef?.nativeElement) {
      const imgEl = this.imageRef.nativeElement;
      const parent = imgEl.parentElement;

      if (parent && parent.tagName.toLowerCase() !== 'a') {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.target = '_blank';
        imgEl.replaceWith(anchor);
        anchor.appendChild(imgEl);
      }
    }
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }

}
