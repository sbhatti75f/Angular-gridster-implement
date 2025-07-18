import {
  Component,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { GridsterItem } from 'angular-gridster2';

@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.css']
})
export class TextComponent {
  @Input() items: (GridsterItem & { type: 'text' | 'image' })[] = [];
  @Output() saveChangesRequested = new EventEmitter<void>();
  @Output() discardChangesRequested = new EventEmitter<void>();

  triggerSave(): void {
    this.saveChangesRequested.emit();
  }

  triggerDiscard(): void {
    this.discardChangesRequested.emit();
  }
  deleteItem(index: number) {
    this.items.splice(index, 1);
  }

}
