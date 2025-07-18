import {
  Component,
  Input,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';

@Component({
  selector: 'app-gridster-wrapper',
  templateUrl: './gridster-wrapper.component.html',
  styleUrls: ['./gridster-wrapper.component.css']
})
export class GridsterWrapperComponent implements AfterViewInit, OnDestroy {
  @Input() items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  @Output() deleteItemRequested = new EventEmitter<number>();

  options: GridsterConfig = {
    draggable: {
      enabled: true,
      ignoreContent: true
    },
    resizable: {
      enabled: true
    },
    pushItems: true,
    minCols: 6,
    minRows: 6
  };

  focusedId: number | null = null;  // Now tracking by ID instead of index
  editableDivMap: { [id: number]: ElementRef } = {};
  styleStateMap: { [id: number]: any } = {};  // Using ID as key

  private globalClickUnlisten!: () => void;

  constructor(private renderer: Renderer2, private hostRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.globalClickUnlisten = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const clickedInside = this.hostRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.focusedId = null;
      }
    });
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

  // Helper method to get default style state
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
      deleted: false
    };
  }

  // Clean up state when an item is deleted
  cleanUpState(id: number) {
    delete this.styleStateMap[id];
    delete this.editableDivMap[id];
    if (this.focusedId === id) {
      this.focusedId = null;
    }
  }
}