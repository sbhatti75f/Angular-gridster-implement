import { Component, Input, Output, ViewChild, EventEmitter} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { GridsterWrapperComponent } from '../gridster-wrapper/gridster-wrapper.component'; 

@Component({
  selector: 'app-image',
  templateUrl: './image.component.html',
  styleUrls: ['./image.component.css']
})
export class ImageComponent {
  @Input() items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  @Output() saveChangesRequested = new EventEmitter<void>();
  @Output() discardChangesRequested = new EventEmitter<void>();
  @Input() imageUrlMap: { [id: number]: string } = {};

  
  @ViewChild(GridsterWrapperComponent) gridsterWrapper!: GridsterWrapperComponent;

  triggerSave(): void {
    this.saveChangesRequested.emit();
  }

  triggerDiscard(): void {
    this.discardChangesRequested.emit();
  }

  deleteItem(id: number) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      this.gridsterWrapper.cleanUpState(id);
    }
  }
}
