import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  Renderer2,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.css']
})
export class TextAreaComponent implements AfterViewInit, OnChanges {
  @ViewChild('editableDiv') editableDiv!: ElementRef;
  @Output() focusChanged = new EventEmitter<boolean>(); 
  @Output() editableRef = new EventEmitter<ElementRef>();
  @Input() styleState: any = {}; 

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    this.setupFocusListeners();
    this.setupBlurCleaner();
    this.editableRef.emit(this.editableDiv);
    this.applyStyleState(); 
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['styleState'] && this.editableDiv) {
      this.applyStyleState(); 
    }
  }

  private applyStyleState(): void {
    const el = this.editableDiv?.nativeElement;
    if (!el || !this.styleState) return;

    // Apply all relevant styles
    this.renderer.setStyle(el, 'font-weight', this.styleState.fontWeight || 'normal');
    this.renderer.setStyle(el, 'font-style', this.styleState.fontStyle || 'normal');
    this.renderer.setStyle(el, 'font-size', this.styleState.fontSize || '16px');
    this.renderer.setStyle(el, 'text-align', this.styleState.textAlign || 'left');
    this.renderer.setStyle(el, 'color', this.styleState.color || '#000000');
    this.renderer.setStyle(el, 'background-color', this.styleState.backgroundColor || 'transparent');
    this.renderer.setStyle(el, 'border-color', this.styleState.borderColor || '#cccccc');
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
