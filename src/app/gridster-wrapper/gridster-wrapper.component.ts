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

  imageLinkMap: { [id: number]: string } = {};


  triggerSave(): void {
    this.saveChangesRequested.emit();
  }

  triggerDiscard(): void {
    this.discardChangesRequested.emit();
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
  }

  ngOnDestroy(): void {
    if (this.globalClickUnlisten) {
      this.globalClickUnlisten();
    }
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
