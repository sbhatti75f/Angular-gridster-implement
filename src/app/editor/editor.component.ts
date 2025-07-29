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
  @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;

  @Output() discard = new EventEmitter<void>();
  viewMode: contentType | null = null;
  imageUrlMap: { [id: number]: string } = {};

  items: (GridsterItem & { type: 'text' | 'image'; id: number; content?: string })[] = [];
  itemCounter = 0;

  private replacingImageId: number | null = null;

  replaceImage(id: number): void {
    console.log('Editor: Replace image requested for ID:', id);
    this.replacingImageId = id;
    this.imageInput.nativeElement.click();
  }

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
      id: newId,
      content: '' // Initialize with empty content
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
      this.imageInput.nativeElement.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      
      if (this.replacingImageId !== null) {
        // Replace existing image
        this.imageUrlMap[this.replacingImageId] = dataUrl;
        this.replacingImageId = null; // Reset
      } else {
        // Add new image (existing logic)
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
        this.imageUrlMap[newId] = dataUrl;
      }

      // Clear input
      this.imageInput.nativeElement.value = '';
    };

    reader.readAsDataURL(file);
  }

  saveChanges(): void {
    // Collect current text content and styles from all text items
    const textContents: { [id: number]: string } = {};
    const textStyles: { [id: number]: any } = {};
    
    this.items.forEach(item => {
      if (item.type === 'text') {
        // Find the corresponding text area element and get its content
        const textElements = document.querySelectorAll(`[data-text-id="${item.id}"] .editable-div`);
        if (textElements.length > 0) {
          const editableDiv = textElements[0] as HTMLElement;
          textContents[item.id] = editableDiv.innerHTML || '';
          // Also update the item's content property
          item.content = editableDiv.innerHTML || '';
          
          // Capture all computed and applied styles
          const computedStyle = window.getComputedStyle(editableDiv);
          textStyles[item.id] = {
            fontWeight: editableDiv.style.fontWeight || computedStyle.fontWeight || 'normal',
            fontStyle: editableDiv.style.fontStyle || computedStyle.fontStyle || 'normal',
            fontSize: editableDiv.style.fontSize || computedStyle.fontSize || '16px',
            textAlign: editableDiv.style.textAlign || computedStyle.textAlign || 'left',
            color: editableDiv.style.color || computedStyle.color || '#000000',
            backgroundColor: editableDiv.style.backgroundColor || computedStyle.backgroundColor || 'transparent',
            borderColor: editableDiv.style.borderColor || computedStyle.borderColor || '#cccccc',
            borderStyle: editableDiv.style.borderStyle || computedStyle.borderStyle || 'none',
            borderWidth: editableDiv.style.borderWidth || computedStyle.borderWidth || '0px',
            display: editableDiv.style.display || computedStyle.display || 'block',
            flexDirection: editableDiv.style.flexDirection || computedStyle.flexDirection || 'column',
            justifyContent: editableDiv.style.justifyContent || computedStyle.justifyContent || 'flex-start'
          };
        }
      }
    });

    // Get image links from GridsterWrapper component
    const imageLinks = this.getImageLinksFromGridster();

    const editorData = {
      gridItems: this.items, // This now includes content for text items
      imageUrls: this.imageUrlMap,
      textContents: textContents, // Separate mapping for text contents
      textStyles: textStyles, // Save all styling information
      imageLinks: imageLinks // Save image links
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(editorData));
    alert('Editor content and images saved to local storage!');
  }

  // Helper method to get image links from GridsterWrapper
  private getImageLinksFromGridster(): { [id: number]: string } {
    // Dispatch custom event to request image links from GridsterWrapper
    const getLinksEvent = new CustomEvent('getImageLinks', { 
      detail: { callback: null }
    });
    
    let imageLinks: { [id: number]: string } = {};
    
    // Create a synchronous way to get the data
    const linkRequestEvent = new CustomEvent('requestImageLinks');
    document.dispatchEvent(linkRequestEvent);
    
    // Try to get the links from a global temporary storage
    const tempLinks = (window as any).tempImageLinks;
    if (tempLinks) {
      imageLinks = tempLinks;
      delete (window as any).tempImageLinks;
    }
    
    return imageLinks;
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

      // Step 2: Restore image links to GridsterWrapper
      const imageLinks = parsedData.imageLinks || {};
      this.restoreImageLinksToGridster(imageLinks);

      // Step 3: Allow DOM to update (gridster + editable divs reappear)
      setTimeout(() => {
        // Step 4: Restore text content and styles for each text item
        const textContents = parsedData.textContents || {};
        const textStyles = parsedData.textStyles || {};
        
        this.items.forEach(item => {
          if (item.type === 'text') {
            // Use both the separate textContents mapping and item.content as fallback
            const savedContent = textContents[item.id] || item.content || '';
            const savedStyles = textStyles[item.id] || {};
            
            // Find and restore content to the corresponding text area
            const textElements = document.querySelectorAll(`[data-text-id="${item.id}"] .editable-div`);
            if (textElements.length > 0) {
              const editableDiv = textElements[0] as HTMLElement;
              editableDiv.innerHTML = savedContent;
              
              // Restore all saved styles
              if (savedStyles.fontWeight) editableDiv.style.fontWeight = savedStyles.fontWeight;
              if (savedStyles.fontStyle) editableDiv.style.fontStyle = savedStyles.fontStyle;
              if (savedStyles.fontSize) editableDiv.style.fontSize = savedStyles.fontSize;
              if (savedStyles.textAlign) editableDiv.style.textAlign = savedStyles.textAlign;
              if (savedStyles.color) editableDiv.style.color = savedStyles.color;
              if (savedStyles.backgroundColor) editableDiv.style.backgroundColor = savedStyles.backgroundColor;
              if (savedStyles.borderColor) editableDiv.style.borderColor = savedStyles.borderColor;
              if (savedStyles.borderStyle) editableDiv.style.borderStyle = savedStyles.borderStyle;
              if (savedStyles.borderWidth) editableDiv.style.borderWidth = savedStyles.borderWidth;
              if (savedStyles.display) editableDiv.style.display = savedStyles.display;
              if (savedStyles.flexDirection) editableDiv.style.flexDirection = savedStyles.flexDirection;
              if (savedStyles.justifyContent) editableDiv.style.justifyContent = savedStyles.justifyContent;
            }
          }
        });

        // Step 5: Trigger a forced refresh to update styleStateMap in GridsterWrapper
        // We need to dispatch a custom event that the GridsterWrapper can listen to
        setTimeout(() => {
          const refreshEvent = new CustomEvent('restoreStyles', { 
            detail: { 
              textStyles: textStyles,
              itemIds: this.items.filter(item => item.type === 'text').map(item => item.id)
            } 
          });
          document.dispatchEvent(refreshEvent);
        }, 50);

        // Hide the editor panel
        this.editorWrapper.nativeElement.classList.add('hidden');

        alert('Editor has been restored to the last saved state.');
      }, 100); // Increased timeout to ensure DOM updates

    } catch (err) {
      console.error('Failed to parse saved editor data:', err);
      alert('Failed to restore the saved state.');
    }
  }

  // Helper method to restore image links to GridsterWrapper
  private restoreImageLinksToGridster(imageLinks: { [id: number]: string }): void {
    const restoreLinksEvent = new CustomEvent('restoreImageLinks', {
      detail: { imageLinks }
    });
    document.dispatchEvent(restoreLinksEvent);
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