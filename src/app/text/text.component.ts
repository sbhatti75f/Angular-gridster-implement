import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild
} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';
import { GridsterWrapperComponent } from '../gridster-wrapper/gridster-wrapper.component'; 

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.scss']
})
export class TextComponent {
  @Input() items: (GridsterItem & { type: 'text' | 'image'; id: number })[] = [];
  @Output() saveChangesRequested = new EventEmitter<void>();
  @Output() discardChangesRequested = new EventEmitter<void>();
  
  @ViewChild(GridsterWrapperComponent) gridsterWrapper!: GridsterWrapperComponent;

  triggerSave(): void {
    this.saveChangesRequested.emit();
  }

  triggerDiscard(): void {
    this.discardChangesRequested.emit();
  }

  deleteItem(index: number) {
    const itemId = this.items[index].id;
    this.items.splice(index, 1);
    
    if (this.gridsterWrapper) {
      this.gridsterWrapper.cleanUpState(itemId);
    }
  }
}