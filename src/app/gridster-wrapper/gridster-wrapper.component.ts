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
  @Input() items: (GridsterItem & { type: 'text' | 'image' })[] = [];
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

  focusedIndex: number | null = null;
  editableDivMap: { [index: number]: ElementRef } = {};

  private globalClickUnlisten!: () => void;

  constructor(private renderer: Renderer2, private hostRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.globalClickUnlisten = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const clickedInside = this.hostRef.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.focusedIndex = null;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.globalClickUnlisten) {
      this.globalClickUnlisten();
    }
  }

  styleStateMap: { [index: number]: any } = {};  // for retaining the state of text-bar for every particular gridster

  onFocusChange(index: number, isFocused: boolean) {
  this.focusedIndex = isFocused ? index : null;

  if (isFocused && !this.styleStateMap[index]) {
    this.styleStateMap[index] = {
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
}


  onStyleChanged(index: number, updatedStyle: any) {
    this.styleStateMap[index] = { ...updatedStyle };
  }

  setEditableDiv(index: number, ref: ElementRef) {
    this.editableDivMap[index] = ref;
  }
}
