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
  selectedFontSize = 'medium'; // Matches your data-size values

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
    small: '12px',
    medium: '16px',
    large: '24px',
    xlarge: '32px' // Add 'xlarge' if you plan to use it. Your HTML had only small, medium, large.
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
      this.setupSvgClickToggles();
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

  /**
   * Applies the styleState to the actual content editable div.
   * This ensures the visual representation of the text matches the saved state.
   */
  private applyStyleStateToEditableDiv(state: any): void {
    const editable = this.editableDiv?.nativeElement;
    if (!editable) return;

    editable.style.fontWeight = state.fontWeight || 'normal';
    editable.style.fontStyle = state.fontStyle || 'normal';
    editable.style.fontSize = this.fontSizeMap[state.fontSize || 'medium'];
    editable.style.textAlign = state.textAlign || 'left';
    editable.style.color = state.color || '#000000';
    editable.style.backgroundColor = state.backgroundColor || '#ffffff';
    editable.style.borderColor = state.borderColor || '#cccccc';

    // Ensure flex properties for vertical alignment are set consistently
    editable.style.display = 'flex';
    editable.style.flexDirection = 'column';
    editable.style.justifyContent = this.getFlexValue(state.verticalAlign || 'top');
  }

  private setupSvgClickToggles(): void {
    const icons = document.querySelectorAll('.svg-default');
    icons.forEach(icon => {
      this.renderer.listen(icon, 'click', (e: Event) => {
        icon.classList.toggle('active');
      });
    });
  }


  /**
   * Updates SVG icon colors based on the current selectedColor.
   * This is necessary because SVGs often don't inherit CSS 'fill' directly for <use> elements.
   */
  private updateSvgColors(): void {
    const iconSvg = this.textColorIcon?.nativeElement;
    if (iconSvg) {
      // Apply fill to the parent SVG
      this.renderer.setStyle(iconSvg, 'fill', this.selectedColor);
      const useTag = iconSvg.querySelector('use');
      if (useTag) {
        // Also apply fill to the <use> tag directly if necessary for older browsers/SVG rendering
        this.renderer.setAttribute(useTag, 'fill', this.selectedColor);
      }
    }

    // Update dash icons fill color
    // This part still relies on global query selector for SVG dashes by ID
    // If these dashes are within *this specific component's template*, you should use @ViewChild for them too.
    // Assuming they are global or fixed and always appear together:
    const dashIds = ['dash1', 'dash2', 'dash3', 'dash4', 'dash5', 'dash6'];
    dashIds.forEach(id => {
      const dashSvg = document.getElementById(id);
      const useEl = dashSvg?.querySelector('use');
      if (useEl) {
        this.renderer.setAttribute(useEl, 'fill', this.selectedColor);
      }
    });
  }

  /**
   * Emits the current style state up to the parent component (GridsterWrapperComponent).
   */
  private emitStyleState(): void {
    this.styleChanged.emit({
      fontWeight: this.isBoldActive ? 'bold' : 'normal',
      fontStyle: this.isItalicActive ? 'italic' : 'normal',
      fontSize: this.selectedFontSize,
      color: this.selectedColor,
      backgroundColor: this.selectedBackgroundColor,
      borderColor: this.selectedBorderColor,
      textAlign: this.selectedTextAlign,
      verticalAlign: this.selectedVerticalAlign
    });
  }

  /**
   * Sets up event listeners for the content editable div.
   * These are crucial for saving selection, handling links, etc.
   */
  private setupEditableDivListeners(): void {
    // Clear previous listeners to prevent duplicates if editableDiv changes
    this.clickListeners.filter(unlisten => unlisten.name === 'editableDivListener').forEach(unlisten => unlisten());
    this.clickListeners = this.clickListeners.filter(unlisten => unlisten.name !== 'editableDivListener');

    const editable = this.editableDiv.nativeElement;

    this.clickListeners.push(this.renderer.listen(editable, 'mouseup', () => {
      this.saveSelection();
    }));
    this.clickListeners.push(this.renderer.listen(editable, 'keyup', () => {
      this.saveSelection();
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

  toggleBold(): void {
    this.isBoldActive = !this.isBoldActive;
    this.applyTextStyle('fontWeight', this.isBoldActive ? 'bold' : 'normal');
    this.emitStyleState();
  }

  toggleItalic(): void {
    this.isItalicActive = !this.isItalicActive;
    this.applyTextStyle('fontStyle', this.isItalicActive ? 'italic' : 'normal');
    this.emitStyleState();
  }

  changeFontSize(size: string, event: MouseEvent): void {
    event.stopPropagation(); // Prevent event from bubbling up
    this.selectedFontSize = size;
    const pxSize = this.fontSizeMap[size] || '16px';
    this.editableDiv.nativeElement.style.fontSize = pxSize;
    this.isTextSizeDropdownOpen = false; // Close the dropdown
    this.emitStyleState();
  }

  changeTextColor(color: string, event?: Event): void {
    if (event) {
      event.stopPropagation(); 
    }
    this.selectedColor = color;
    this.applyTextStyle('color', color);
    this.updateSvgColors();
    this.emitStyleState();
    this.showTextColorInput = false; 
  }

  changeBackgroundColor(color: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedBackgroundColor = color;
    this.editableDiv.nativeElement.style.backgroundColor = color;
    this.emitStyleState();
    this.showBackColorInput = false; 
  }

  changeBorderColor(color: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedBorderColor = color;
    
    const editable = this.editableDiv.nativeElement;

    editable.style.borderStyle = 'solid';
    editable.style.borderWidth = '1px';
    editable.style.borderColor = color;
    
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
    const editable = this.editableDiv.nativeElement;
    editable.style.display = 'flex';
    editable.style.flexDirection = 'column';
    editable.style.justifyContent = this.getFlexValue(align);
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
    if (sel && sel.rangeCount > 0) {
      this.savedSelection = sel.getRangeAt(0);
    }
  }

  restoreSelection(): void {
    if (this.savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedSelection);
    }
  }

  handleColorIconClick(type: 'text' | 'background' | 'border'): void {
    // Toggle the specific color input visibility
    if (type === 'text') {
      this.showTextColorInput = !this.showTextColorInput;
      this.showBackColorInput = false;
      this.showBorderColorInput = false;
    } else if (type === 'background') {
      this.showBackColorInput = !this.showBackColorInput;
      this.showTextColorInput = false;
      this.showBorderColorInput = false;
    } else if (type === 'border') {
      this.showBorderColorInput = !this.showBorderColorInput;
      this.showTextColorInput = false;
      this.showBackColorInput = false;
    }
  }

  /**
   * Applies text style to the selected content or the entire editable div.
   * This method uses `document.execCommand` for basic formatting,
   * but also provides a fallback for more complex scenarios or if execCommand isn't suitable.
   */
  private applyTextStyle(styleProperty: string, styleValue: string): void {
    this.restoreSelection();
    const editable = this.editableDiv.nativeElement;
    editable.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      // If no selection or collapsed, apply to the entire editable div
      (editable.style as any)[styleProperty] = styleValue;
    } else {
      // If there's a selection, apply to the selected range using execCommand or span wrapper
      try {
        // Enable CSS styling for execCommand
        document.execCommand('styleWithCSS', false, 'true');
        if (styleProperty === 'fontWeight') {
          document.execCommand('bold', false, undefined);
        } else if (styleProperty === 'fontStyle') {
          document.execCommand('italic', false, undefined);
        } else if (styleProperty === 'color') {
          document.execCommand('foreColor', false, styleValue);
        }
      } catch (e) {
        // Fallback: If execCommand is not sufficient or fails, wrap in a span
        const range = selection.getRangeAt(0);
        const span = this.renderer.createElement('span');
        this.renderer.setStyle(span, styleProperty, styleValue);
        this.renderer.appendChild(span, range.extractContents()); // Move selected content into span
        range.deleteContents(); // Remove original content
        range.insertNode(span); // Insert the new span
        selection.removeAllRanges();
        selection.addRange(range); // Restore selection to the new content
      }
    }
  }

  insertLink(): void {
    this.restoreSelection();
    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      alert('Please select the text you want to link.');
      return;
    }

    const url = prompt('Enter the URL to link to:');
    if (!url) return;

    const range = selection.getRangeAt(0);
    const anchor = this.renderer.createElement('a');
    this.renderer.setAttribute(anchor, 'href', url.startsWith('http') ? url : 'https://' + url);
    this.renderer.setAttribute(anchor, 'target', '_blank');
    this.renderer.setAttribute(anchor, 'rel', 'noopener noreferrer');
    this.renderer.setStyle(anchor, 'text-decoration', 'underline');

    // Move selected text into the anchor element
    this.renderer.appendChild(anchor, range.extractContents());

    // Replace selected text with the anchor element
    range.deleteContents();
    range.insertNode(anchor);

    // Collapse selection after inserted link
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(anchor);
    newRange.collapse(true);
    selection.addRange(newRange);

    this.emitStyleState(); // Emit state to save link info if needed (though link content is in div)
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}