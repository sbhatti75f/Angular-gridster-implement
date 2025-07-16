import { Component, AfterViewInit, ViewChild, ElementRef, Renderer2, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.css']
})
export class TextAreaComponent implements AfterViewInit {
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @Output() focusChanged = new EventEmitter<boolean>(); 
  @Output() editableRef = new EventEmitter<ElementRef>();

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.setupFocusListeners();
    this.setupBlurCleaner();
    this.editableRef.emit(this.editableDiv);
  }

  private setupFocusListeners(): void {
    this.renderer.listen(this.editableDiv.nativeElement, 'focus', () => {
      this.focusChanged.emit(true);
    });
    this.renderer.listen(this.editableDiv.nativeElement, 'blur', () => {
      this.focusChanged.emit(false);
    });
  }

  private setupBlurCleaner(): void {
    this.renderer.listen(this.editableDiv.nativeElement, 'blur', () => {
      const spans = this.editableDiv.nativeElement.querySelectorAll('span');
      spans.forEach((span: HTMLElement) => {
        if (!span.innerHTML.trim() || span.textContent === '\u200B') {
          span.remove();
        }
      });
    });
  }

}
