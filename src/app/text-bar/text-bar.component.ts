import {
  Component,
  ViewChild,
  ElementRef,
  Renderer2,
  AfterViewInit,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  OnDestroy
} from '@angular/core';

@Component({
  selector: 'app-text-bar',
  templateUrl: './text-bar.component.html',
  styleUrls: ['./text-bar.component.scss']
})
export class TextBarComponent implements OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('textColorIcon') textColorIcon!: ElementRef<SVGSVGElement>;

  // Template reference variables for dropdowns
  @ViewChild('textSizeControl') textSizeControl!: ElementRef;
  @ViewChild('alignmentControl') alignmentControl!: ElementRef;
  @ViewChild('vAlignControl') vAlignControl!: ElementRef;

  @Input() editableDiv!: ElementRef;
  @Input() styleState: any; // This will receive the state from GridsterWrapper
  @Output() styleChanged = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<void>();

  // Internal component state
  isBoldActive = false;
  isItalicActive = false;
  selectedColor = '#000000';
  selectedBackgroundColor = '#ffffff';
  selectedBorderColor = '#cccccc';
  selectedTextAlign = 'left';
  selectedVerticalAlign = 'top';
  selectedFontSize = 'medium';

  // UI state for dropdowns and color pickers
  showTextColorInput = false;
  showBackColorInput = false;
  showBorderColorInput = false;
  isTextSizeDropdownOpen = false;
  isAlignmentDropdownOpen = false;
  isVerticalAlignmentDropdownOpen = false;

  private savedSelection: Range | null = null;
  private clickListeners: (() => void)[] = []; // To store unsubscribe functions for Renderer2

  private fontSizeMap: { [key: string]: string } = {
    small: '10px',
    medium: '14px',
    large: '18px',
  };

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['styleState'] && this.styleState) {
      // Update internal component state based on the input styleState
      this.isBoldActive = this.styleState.fontWeight === 'bold';
      this.isItalicActive = this.styleState.fontStyle === 'italic';
      this.selectedFontSize = this.styleState.fontSize || 'medium';
      this.selectedColor = this.styleState.color || '#000000';
      this.selectedBackgroundColor = this.styleState.backgroundColor || '#ffffff';
      this.selectedBorderColor = this.styleState.borderColor || '#cccccc';
      this.selectedTextAlign = this.styleState.textAlign || 'left';
      this.selectedVerticalAlign = this.styleState.verticalAlign || 'top';

      // Apply styles to the editable div immediately if it's available
      if (this.editableDiv?.nativeElement) {
        this.applyStyleStateToEditableDiv(this.styleState);
        this.updateSvgColors(); // Update SVG colors when styleState changes
      }
    }
    // Handle changes to editableDiv itself, e.g., if it's assigned later
    if (changes['editableDiv'] && this.editableDiv?.nativeElement && this.styleState) {
      // Re-apply styles and setup listeners if editableDiv changes
      this.applyStyleStateToEditableDiv(this.styleState);
      this.updateSvgColors();
      this.setupEditableDivListeners();
    }
  }

  ngAfterViewInit(): void {
    // Initial application of styles and setting up listeners
    // Use setTimeout to ensure editableDiv.nativeElement and other @ViewChild elements are rendered
    setTimeout(() => {
      if (this.editableDiv?.nativeElement && this.styleState) {
        this.applyStyleStateToEditableDiv(this.styleState);
        this.updateSvgColors();
        this.setupEditableDivListeners();
      }
    }, 0);

    // Setup global click listener to close dropdowns and color pickers
    this.clickListeners.push(this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const clickedEl = event.target as HTMLElement;

      // Close text size dropdown if click is outside
      if (this.textSizeControl && !this.textSizeControl.nativeElement.contains(clickedEl)) {
        this.isTextSizeDropdownOpen = false;
      }
      // Close alignment dropdown if click is outside
      if (this.alignmentControl && !this.alignmentControl.nativeElement.contains(clickedEl)) {
        this.isAlignmentDropdownOpen = false;
      }
      // Close vertical alignment dropdown if click is outside
      if (this.vAlignControl && !this.vAlignControl.nativeElement.contains(clickedEl)) {
        this.isVerticalAlignmentDropdownOpen = false;
      }

      // Close color inputs if click is outside their respective wrappers and inputs
      const isColorInputOrTrigger = clickedEl.closest('.text-color') || clickedEl.closest('.text-color-input') ||
                                   clickedEl.closest('.backcolor') || clickedEl.closest('.body-color-input') ||
                                   clickedEl.closest('.border-fill') || clickedEl.closest('.border-color-input');
      if (!isColorInputOrTrigger) {
        this.showTextColorInput = false;
        this.showBackColorInput = false;
        this.showBorderColorInput = false;
      }
    }));
  }

  ngOnDestroy(): void {
    // Clean up all registered listeners to prevent memory leaks
    this.clickListeners.forEach(unlisten => unlisten());
  }

  private applyStyleStateToEditableDiv(state: any): void {
    const editable = this.editableDiv?.nativeElement;
    if (!editable) return;
  
    // Get the new wrapper and the main container
    const alignmentWrapper = editable.parentElement;
    const mainContainer = alignmentWrapper?.parentElement;
  
    if (!alignmentWrapper || !mainContainer) return;
  
    // Apply text-specific styles to the editable div itself
    editable.style.textAlign = state.textAlign || 'left';
  
    // Apply background and border to the OUTERMOST container
    mainContainer.style.backgroundColor = state.backgroundColor || '#ffffff';
    mainContainer.style.borderColor = state.borderColor || '#cccccc';
    mainContainer.style.borderStyle = state.borderColor ? 'solid' : 'none';
    mainContainer.style.borderWidth = state.borderColor ? '1px' : '0';
  
    // Apply vertical alignment to the new alignment wrapper
    alignmentWrapper.style.justifyContent = this.getFlexValue(state.verticalAlign || 'top');
  }

  private updateSvgColors(): void {
    const iconSvg = this.textColorIcon?.nativeElement;
    if (iconSvg) {
      this.renderer.setStyle(iconSvg, 'fill', this.selectedColor);
      const useTag = iconSvg.querySelector('use');
      if (useTag) {
        this.renderer.setAttribute(useTag, 'fill', this.selectedColor);
      }
    }

    const dashIds = ['dash1', 'dash2', 'dash3', 'dash4', 'dash5', 'dash6'];
    dashIds.forEach(id => {
      const dashSvg = document.getElementById(id);
      const useEl = dashSvg?.querySelector('use');
      if (useEl) {
        this.renderer.setAttribute(useEl, 'fill', this.selectedColor);
      }
    });
  }

  private emitStyleState(): void {
    this.styleChanged.emit({
      textAlign: this.selectedTextAlign,
      verticalAlign: this.selectedVerticalAlign,
      backgroundColor: this.selectedBackgroundColor,
      borderColor: this.selectedBorderColor
    });
  }

  private setupEditableDivListeners(): void {
    this.clickListeners.filter(unlisten => unlisten.name === 'editableDivListener').forEach(unlisten => unlisten());
    this.clickListeners = this.clickListeners.filter(unlisten => unlisten.name !== 'editableDivListener');

    const editable = this.editableDiv.nativeElement;

    this.clickListeners.push(this.renderer.listen(editable, 'mouseup', () => {
      this.saveSelection();
      this.updateActiveStatesBasedOnSelection();
    }));
    this.clickListeners.push(this.renderer.listen(editable, 'keyup', () => {
      this.saveSelection();
      this.updateActiveStatesBasedOnSelection();
    }));
    this.clickListeners.push(this.renderer.listen(editable, 'click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'A') {
        event.preventDefault();
        const url = (target as HTMLAnchorElement).href;
        window.open(url, '_blank');
      }
    }));
  }

  private updateActiveStatesBasedOnSelection(): void {
    const editable = this.editableDiv.nativeElement;
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let commonAncestor: Node | null = null;

      if (selection.isCollapsed) {
        commonAncestor = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentNode;
      } else {
        commonAncestor = range.commonAncestorContainer;
      }

      if (commonAncestor && commonAncestor !== editable) {
        let currentElement: HTMLElement | null = commonAncestor instanceof HTMLElement ? commonAncestor : commonAncestor.parentElement;
        this.isBoldActive = false;
        this.isItalicActive = false;

        while (currentElement && currentElement !== editable) {
          const computedStyle = window.getComputedStyle(currentElement);
          const inlineStyle = currentElement.style;

          if (inlineStyle.fontWeight === 'bold' || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight, 10) >= 700) {
            this.isBoldActive = true;
          }
          if (inlineStyle.fontStyle === 'italic' || computedStyle.fontStyle === 'italic') {
            this.isItalicActive = true;
          }
          
          currentElement = currentElement.parentElement;
        }
      } else {
        this.isBoldActive = false;
        this.isItalicActive = false;
      }
    } else {
      this.isBoldActive = false;
      this.isItalicActive = false;
    }
  }
  
  private applyTextStyle(command: string, value?: string): void {
    this.restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, value);
    this.saveSelection();
  }

  toggleBold(): void {
    this.applyTextStyle('bold');
    this.updateActiveStatesBasedOnSelection();
  }

  toggleItalic(): void {
    this.applyTextStyle('italic');
    this.updateActiveStatesBasedOnSelection();
  }
  
  private applyStyleToSelection(style: string, value: string): void {
    this.restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const span = this.renderer.createElement('span');
    this.renderer.setStyle(span, style, value);
    
    if (!range.collapsed) {
        this.renderer.appendChild(span, range.extractContents());
        range.insertNode(span);
    } else {
        this.renderer.appendChild(span, this.renderer.createText('\u200B'));
        range.insertNode(span);
        selection.collapse(span, 1);
    }
    
    this.saveSelection();
  }

  changeFontSize(size: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFontSize = size;
    const pxSize = this.fontSizeMap[size] || '16px';
    this.applyStyleToSelection('fontSize', pxSize);
    this.isTextSizeDropdownOpen = false;
  }

  changeTextColor(color: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedColor = color;
    this.applyTextStyle('foreColor', color);
    this.updateSvgColors();
    this.showTextColorInput = false;
  }

  changeBackgroundColor(color: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedBackgroundColor = color;
    const mainContainer = this.editableDiv.nativeElement.parentElement.parentElement;
    if (mainContainer) {
      mainContainer.style.backgroundColor = color;
    }
    this.emitStyleState();
    this.showBackColorInput = false;
  }

  changeBorderColor(color: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedBorderColor = color;

    const mainContainer = this.editableDiv.nativeElement.parentElement.parentElement;
    if (mainContainer) {
      mainContainer.style.borderStyle = 'solid';
      mainContainer.style.borderWidth = '1px';
      mainContainer.style.borderColor = color;
    }

    this.emitStyleState();
    this.showBorderColorInput = false;
  }

  changeTextAlign(align: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTextAlign = align;
    this.editableDiv.nativeElement.style.textAlign = align;
    this.isAlignmentDropdownOpen = false;
    this.emitStyleState();
  }

  changeVerticalAlign(align: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedVerticalAlign = align;
    const alignmentWrapper = this.editableDiv.nativeElement.parentElement;
    if (alignmentWrapper) {
      alignmentWrapper.style.justifyContent = this.getFlexValue(align);
    }
    this.isVerticalAlignmentDropdownOpen = false;
    this.emitStyleState();
  }

  private getFlexValue(val: string): string {
    return {
      top: 'flex-start',
      middle: 'center',
      bottom: 'flex-end'
    }[val] || 'flex-start';
  }

  saveSelection(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && this.editableDiv?.nativeElement.contains(sel.anchorNode)) {
      this.savedSelection = sel.getRangeAt(0);
    } else {
      this.savedSelection = null;
    }
  }

  restoreSelection(): void {
    if (this.savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedSelection);
      this.editableDiv.nativeElement.focus();
    } else {
      this.editableDiv.nativeElement.focus();
    }
  }

  handleColorIconClick(type: 'text' | 'background' | 'border'): void {
    if (type === 'text') this.showTextColorInput = !this.showTextColorInput;
    else if (type === 'background') this.showBackColorInput = !this.showBackColorInput;
    else if (type === 'border') this.showBorderColorInput = !this.showBorderColorInput;

    if (type !== 'text') this.showTextColorInput = false;
    if (type !== 'background') this.showBackColorInput = false;
    if (type !== 'border') this.showBorderColorInput = false;
  }

  // text-bar.component.ts

  insertLink(): void {
    this.restoreSelection();
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      alert('Please select the text you want to link.');
      return;
    }

    const url = prompt('Enter the URL to link to:');
    if (!url) {
      return; // User cancelled the prompt
    }

    // ✅ SOLUTION: Check for a protocol and add it if missing.
    let fullUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      fullUrl = 'https://' + url;
    }

    // Use the new, corrected URL.
    this.applyTextStyle('createLink', fullUrl);
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}