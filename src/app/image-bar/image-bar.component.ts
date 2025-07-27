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
        this.imageReplaced.emit(dataUrl); // Emits the new image URL
      };
      reader.readAsDataURL(file);
    }
    // Clear the file input value to allow selecting the same file again
    if (this.fileInputRef && this.fileInputRef.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
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