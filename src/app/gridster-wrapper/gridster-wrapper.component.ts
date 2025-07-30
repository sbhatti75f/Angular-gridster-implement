import {
  Component,
  Input,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter,
} from '@angular/core';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';


@Component({
  selector: 'app-gridster-wrapper',
  templateUrl: './gridster-wrapper.component.html',
  styleUrls: ['./gridster-wrapper.component.scss'],
})
export class GridsterWrapperComponent implements AfterViewInit, OnDestroy {
  @Input() items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  @Output() deleteItemRequested = new EventEmitter<number>();
  @Input() imageUrlMap: { [id: number]: string } = {};
  @Output() saveChangesRequested = new EventEmitter<void>();
  @Output() discardChangesRequested = new EventEmitter<void>();
  @Output() replaceImageRequested = new EventEmitter<number>();

  imageLinkMap: { [id: number]: string } = {};

  triggerSave(): void {
    this.saveChangesRequested.emit();
  }

  triggerDiscard(): void {
    this.discardChangesRequested.emit();
  }

  requestImageReplace(id: number) {
    this.replaceImageRequested.emit(id);
  }
    
  // New map to store ElementRefs of images for linking
  imageElementRefMap: { [id: number]: ElementRef } = {};
  @Output() imageUrlMapChanged = new EventEmitter<{ [id: number]: string }>();

  setImageUrl(id: number, url: string) {
    this.imageUrlMap[id] = url;
    this.imageUrlMapChanged.emit({ ...this.imageUrlMap });
    this.refreshImageElementRef(id);
  }

  setImageLink(id: number, link: string) {
    this.imageLinkMap[id] = link;
  }

  setImageElementRef(id: number, ref: ElementRef) {
    this.imageElementRefMap[id] = ref;
  }

  options: GridsterConfig = {
    draggable: {
      enabled: true,
      ignoreContent: true,
    },
    resizable: {
      enabled: true,
    },
    pushItems: true,
    minCols: 6,
    minRows: 6,
  };

  focusedId: number | null = null;
  editableDivMap: { [id: number]: ElementRef } = {};
  styleStateMap: { [id: number]: any } = {};

  // New property for dynamic z-index
  maxZIndex = 1000; 

  private globalClickUnlisten!: () => void;

  constructor(private renderer: Renderer2, private hostRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.globalClickUnlisten = this.renderer.listen(
      'document',
      'click',
      (event: MouseEvent) => {
        const clickedInside = this.hostRef.nativeElement.contains(event.target);
        if (!clickedInside) {
          this.focusedId = null;
        }
      }
    );

    // Listen for style restoration events from EditorComponent
    this.renderer.listen('document', 'restoreStyles', (event: CustomEvent) => {
      const { textStyles, itemIds } = event.detail;
      this.restoreStyleStates(textStyles, itemIds);
    });

    // Listen for image links request from EditorComponent (for saving)
    this.renderer.listen('document', 'requestImageLinks', () => {
      // Store image links in a temporary global variable for EditorComponent to access
      (window as any).tempImageLinks = { ...this.imageLinkMap };
    });

    // Listen for image links restoration from EditorComponent (for discarding)
    this.renderer.listen('document', 'restoreImageLinks', (event: CustomEvent) => {
      const { imageLinks } = event.detail;
      this.imageLinkMap = { ...imageLinks };
    });
  }

  ngOnDestroy(): void {
    if (this.globalClickUnlisten) {
      this.globalClickUnlisten();
    }
    
    // Clean up temporary storage
    if ((window as any).tempImageLinks) {
      delete (window as any).tempImageLinks;
    }
  }

  // Method to get dynamic z-index for each gridster item
  getItemZIndex(itemId: number): number {
    return this.focusedId === itemId ? this.maxZIndex : 1; 
  }

  onFocusChange(id: number, isFocused: boolean) {
    this.focusedId = isFocused ? id : null;

    if (isFocused && !this.styleStateMap[id]) {
      this.styleStateMap[id] = this.getDefaultStyleState();
    }
  }

  onStyleChanged(id: number, updatedStyle: any) {
    this.styleStateMap[id] = { ...updatedStyle };
  }

  setEditableDiv(id: number, ref: ElementRef) {
    this.editableDivMap[id] = ref;
  }

  private getDefaultStyleState() {
    return {
      fontWeight: 'normal',
      fontStyle: 'normal',
      fontSize: 'medium',
      textAlign: 'left',
      verticalAlign: 'top',
      color: '#000000',
      backgroundColor: '#ffffff',
      borderColor: '#cccccc',
      link: '',
      deleted: false,
    };
  }

  // New method to restore style states from saved data
  restoreStyleStates(textStyles: { [id: number]: any }, itemIds: number[]): void {
    itemIds.forEach(id => {
      const savedStyles = textStyles[id];
      if (savedStyles) {
        // Convert CSS values back to component state format
        const styleState = {
          fontWeight: savedStyles.fontWeight === 'bold' ? 'bold' : 'normal',
          fontStyle: savedStyles.fontStyle === 'italic' ? 'italic' : 'normal',
          fontSize: this.convertPxToSize(savedStyles.fontSize),
          textAlign: savedStyles.textAlign || 'left',
          verticalAlign: this.convertJustifyToVertical(savedStyles.justifyContent),
          color: savedStyles.color || '#000000',
          backgroundColor: savedStyles.backgroundColor === 'transparent' ? '#ffffff' : savedStyles.backgroundColor,
          borderColor: savedStyles.borderColor || '#cccccc',
          link: '',
          deleted: false,
        };
        
        this.styleStateMap[id] = styleState;
      }
    });
  }

  // Helper method to convert px values back to size names
  private convertPxToSize(pxValue: string): string {
    const sizeMap: { [key: string]: string } = {
      '12px': 'small',
      '16px': 'medium', 
      '24px': 'large',
      '32px': 'xlarge'
    };
    return sizeMap[pxValue] || 'medium';
  }

  // Helper method to convert CSS justify-content back to vertical align names
  private convertJustifyToVertical(justifyValue: string): string {
    const alignMap: { [key: string]: string } = {
      'flex-start': 'top',
      'center': 'middle',
      'flex-end': 'bottom'
    };
    return alignMap[justifyValue] || 'top';
  }

  cleanUpState(id: number) {
    delete this.styleStateMap[id];
    delete this.editableDivMap[id];
    if (this.focusedId === id) {
      this.focusedId = null;
    }
    delete this.imageUrlMap[id];
    delete this.imageElementRefMap[id]; // Clean up image ElementRef as well
  }

  handleDelete(id: number) {
    this.cleanUpState(id);
    this.deleteItemRequested.emit(id);
  }

  refreshImageElementRef(id: number) {
    // Re-emit the ElementRef from ImageAreaComponent (indirectly)
    // Use a signal or temporary change in imageUrlMap to trigger ngOnChanges
    const currentUrl = this.imageUrlMap[id];
    this.imageUrlMap[id] = ''; // Force a small change
    setTimeout(() => {
      this.imageUrlMap[id] = currentUrl;
    });
  }
}