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

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements AfterViewInit {
  @ViewChild('contextMenu') contextMenu!: ElementRef;
  @ViewChild('editorWrapper') editorWrapper!: ElementRef;
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @ViewChild('textAreaContainer') container!: ElementRef;
  @Output() discard = new EventEmitter<void>();

  items: (GridsterItem & { type: 'text' | 'image' })[] = [];
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
    this.itemCounter++;

    const itemWidth = 1; 
    const gridCols = 3; 

    let positionFound = false;
    let newX = 0;
    let newY = 1;

    while (!positionFound) {
      const rowItems = this.items.filter(item => item.y === newY);

      let usedCols = 0;
      rowItems.forEach(item => {
        usedCols = Math.max(usedCols, item.x + item.cols);
      });

      if (usedCols + itemWidth <= gridCols) {
        newX = usedCols;
        positionFound = true;
      } else {
        newY++;
      }
    }

    this.items.push({
      x: newX,
      y: newY,
      cols: itemWidth,
      rows: 1,
      type: 'text',
      id: this.itemCounter
    });

    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');
  }


  addImage(): void {
    this.itemCounter++;
    this.items.push({
      x: 0,
      y: 0,
      cols: 2,
      rows: 2,
      type: 'image',
      id: this.itemCounter
    });

    this.editorWrapper.nativeElement.classList.remove('hidden');
    this.contextMenu.nativeElement.classList.add('hidden');
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
      }
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(editorData));
    alert('Editor content saved to local storage!');
  }

  discardChanges(): void {
    if (confirm('Are you sure you want to discard all changes?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      if (this.editableDiv) {
        this.editableDiv.nativeElement.innerHTML = '';
      }
      this.editorWrapper.nativeElement.classList.add('hidden');
      this.discard.emit();
      alert('Changes discarded and editor cleared.');
    }
  }
}

