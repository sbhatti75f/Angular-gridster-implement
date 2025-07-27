import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import {contentType} from '../enums/enums' 

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('contextMenu') contextMenu!: ElementRef;
  @ViewChild('editorWrapper') editorWrapper!: ElementRef;
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @ViewChild('textAreaContainer') container!: ElementRef;
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  @Output() discard = new EventEmitter<void>();
  viewMode: contentType | null = null;
  imageUrlMap: { [id: number]: string } = {};

  items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  itemCounter = 0;

  private readonly STORAGE_KEY = 'editor_saved_data';

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    // Show custom context menu
    this.renderer.listen('document', 'contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      const menu = this.contextMenu.nativeElement;
      menu.style.top = `${e.clientY}px`;
      menu.style.left = `${e.clientX}px`;
      menu.classList.remove('hidden');
    });

    // Hide context menu on click
    this.renderer.listen('document', 'click', () => {
      this.contextMenu.nativeElement.classList.add('hidden');
    });
  }
  
  addText(): void {
    this.viewMode = contentType.Text;
    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');
    const newId = Date.now() + Math.floor(Math.random() * 1000);

    let maxX = 0;
    for (const item of this.items) {
      if (item.y === 1) {  // check row 1 now
        const rightEdge = item.x + item.cols;
        if (rightEdge > maxX) {
          maxX = rightEdge;
        }
      }
    }

    this.items.push({
      x: maxX,
      y: 1,
      cols: 1,
      rows: 1,
      type: 'text',
      id: newId
    });
  }

  addImage(): void {
    this.viewMode = contentType.Image;
    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');

    this.imageInput.nativeElement.click(); 
  }
  
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Check file size (limit: 5MB)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`);
      this.imageInput.nativeElement.value = ''; // Clear input
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newId = Date.now() + Math.floor(Math.random() * 1000);

      let maxX = 0;
      for (const item of this.items) {
        if (item.y === 1) {  
          const rightEdge = item.x + item.cols;
          if (rightEdge > maxX) {
            maxX = rightEdge;
          }
        }
      }

      this.items.push({
        x: maxX,
        y: 1,
        cols: 1,
        rows: 1,
        type: 'image',
        id: newId
      });
      this.imageUrlMap[newId] = reader.result as string;

      // Clear input so user can re-select the same image if needed
      this.imageInput.nativeElement.value = '';
    };

    reader.readAsDataURL(file);
  }


  saveChanges(): void {
    const editorData = {
      content: this.editableDiv?.nativeElement.innerHTML || '',
      styles: {
        fontSize: this.editableDiv?.nativeElement.style.fontSize || '',
        fontWeight: this.editableDiv?.nativeElement.style.fontWeight || '',
        fontStyle: this.editableDiv?.nativeElement.style.fontStyle || '',
        textAlign: this.editableDiv?.nativeElement.style.textAlign || '',
        verticalAlign: this.editableDiv?.nativeElement.style.verticalAlign || ''
      },
      dimensions: {
        width: this.container?.nativeElement.style.width || '',
        height: this.container?.nativeElement.style.height || ''
      },
      gridItems: this.items, // Save positions and types of items
      imageUrls: this.imageUrlMap // Save image base64 content mapped by ID
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(editorData));
    alert('Editor content and images saved to local storage!');
  }


  discardChanges(): void {
    const savedData = localStorage.getItem(this.STORAGE_KEY);

    if (!savedData) {
      alert('No saved data found.');
      return;
    }

    if (!confirm('Are you sure you want to discard unsaved changes and revert to the last saved version?')) return;

    try {
      const parsedData = JSON.parse(savedData);

      // Step 1: Restore grid items and image data
      this.items = parsedData.gridItems || [];
      this.imageUrlMap = parsedData.imageUrls || {};

      // Step 2: Allow DOM to update (gridster + editable divs reappear)
      setTimeout(() => {
        // Step 3: Restore editable text content and styles
        if (this.editableDiv) {
          this.editableDiv.nativeElement.innerHTML = parsedData.content || '';

          const el = this.editableDiv.nativeElement;
          const styles = parsedData.styles || {};

          el.style.fontSize = styles.fontSize || '';
          el.style.fontWeight = styles.fontWeight || '';
          el.style.fontStyle = styles.fontStyle || '';
          el.style.textAlign = styles.textAlign || '';
          el.style.verticalAlign = styles.verticalAlign || '';
        }

        // Step 4: Restore container dimensions
        if (this.container) {
          const dim = parsedData.dimensions || {};
          const containerEl = this.container.nativeElement;
          containerEl.style.width = dim.width || '';
          containerEl.style.height = dim.height || '';
        }

        // Hide the editor panel
        this.editorWrapper.nativeElement.classList.add('hidden');

        alert('Editor has been restored to the last saved state.');
      });

    } catch (err) {
      console.error('Failed to parse saved editor data:', err);
      alert('Failed to restore the saved state.');
    }
  }


  deleteItem(id: number): void {
    // Find the index of the item to delete
    const index = this.items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      // If it's an image item, remove from imageUrlMap
      if (this.items[index].type === 'image') {
        const { [id]: _, ...updatedImageUrls } = this.imageUrlMap;
        this.imageUrlMap = updatedImageUrls;
      }
      
      // Remove item using immutable operation
      this.items = this.items.filter(item => item.id !== id);
    }
  }

  onImageUpdated(updatedMap: { [id: number]: string }): void {
    this.imageUrlMap = { ...updatedMap };
  }

}