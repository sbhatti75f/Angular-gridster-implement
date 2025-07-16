import { Component, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { GridsterConfig, GridsterItem } from 'angular-gridster2';

@Component({
  selector: 'app-gridster-wrapper',
  templateUrl: './gridster-wrapper.component.html',
  styleUrls: ['./gridster-wrapper.component.css']
})
export class GridsterWrapperComponent {
  @Input() items: (GridsterItem & { type: 'text' | 'image' })[] = [];

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

  focusedIndex: number | null = null;
  editableDivMap: { [index: number]: ElementRef } = {};

  onFocusChange(index: number, isFocused: boolean) {
    this.focusedIndex = isFocused ? index : null;
  }

  setEditableDiv(index: number, ref: ElementRef) {
    this.editableDivMap[index] = ref;
  }

}
