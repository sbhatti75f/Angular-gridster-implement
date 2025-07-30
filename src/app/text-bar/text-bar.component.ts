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
    small: '12px',
    medium: '16px',
    large: '24px',
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

  /**
   * Applies the styleState to the actual content editable div.
   * This ensures the visual representation of the text matches the saved state.
   * This handles container-level styles like alignment and default font size/colors.
   */
  private applyStyleStateToEditableDiv(state: any): void {
    const editable = this.editableDiv?.nativeElement;
    if (!editable) return;

    // Apply container-level styles
    editable.style.textAlign = state.textAlign || 'left';
    editable.style.backgroundColor = state.backgroundColor || '#ffffff';
    editable.style.borderColor = state.borderColor || '#cccccc';
    editable.style.borderStyle = state.borderColor ? 'solid' : 'none'; // Ensure border style is set if color exists
    editable.style.borderWidth = state.borderColor ? '1px' : '0'; // Ensure border width is set if color exists

    // Ensure flex properties for vertical alignment are set consistently
    editable.style.display = 'flex';
    editable.style.flexDirection = 'column';
    editable.style.justifyContent = this.getFlexValue(state.verticalAlign || 'top');

    // For font size, color, bold, italic, these are handled by execCommand on inner content.
    // However, if the div is empty, we need a default style for new text.
    // This is often implicitly handled by execCommand setting typing attributes,
    // but a default can be set here if the div is initially empty and no inner spans exist.
    // It's generally better to let execCommand manage this for contenteditable.
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

    const dashIds = ['dash1', 'dash2', 'dash3', 'dash4', 'dash5', 'dash6'];
    dashIds.forEach(id => {
      const dashSvg = document.getElementById(id);
      const useEl = dashSvg?.querySelector('use');
      if (useEl) {
        this.renderer.setAttribute(useEl, 'fill', this.selectedColor);
      }
    });
  }

  /*
    Emits the current style state up to the parent component (GridsterWrapperComponent).
    This includes only container-level styles that apply to the whole text box.
    Inline text styles (bold, italic, font size, text color, background color) are managed by the contenteditable itself.
  */
  private emitStyleState(): void {
    this.styleChanged.emit({
      textAlign: this.selectedTextAlign,
      verticalAlign: this.selectedVerticalAlign,
      backgroundColor: this.selectedBackgroundColor,
      borderColor: this.selectedBorderColor
      // Note: Bold, italic, font size, text color are now managed by inline styles within the contenteditable,
      // not as a single global styleState. We still track them for UI active states.
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

    // Use input and keyup to capture changes and update UI active states
    this.clickListeners.push(this.renderer.listen(editable, 'mouseup', () => {
      this.saveSelection();
      this.updateActiveStatesBasedOnSelection(); // Update bold/italic/color for UI
    }));
    this.clickListeners.push(this.renderer.listen(editable, 'keyup', () => {
      this.saveSelection();
      this.updateActiveStatesBasedOnSelection(); // Update bold/italic/color for UI
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

  /**
   * Updates the UI (isBoldActive, isItalicActive, selectedColor) based on the current selection's styles.
   * This provides feedback to the user about the styles at the caret or on selected text.
   */
  private updateActiveStatesBasedOnSelection(): void {
    const editable = this.editableDiv.nativeElement;
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      let commonAncestor: Node | null = null;

      if (selection.isCollapsed) {
        // If collapsed, check parent element at caret
        commonAncestor = range.startContainer.nodeType === Node.ELEMENT_NODE ? range.startContainer : range.startContainer.parentNode;
      } else {
        // If selection exists, check common ancestor
        commonAncestor = range.commonAncestorContainer;
      }

      if (commonAncestor && commonAncestor !== editable) {
        // Traverse up to find effective styles
        let currentElement: HTMLElement | null = commonAncestor instanceof HTMLElement ? commonAncestor : commonAncestor.parentElement;
        this.isBoldActive = false;
        this.isItalicActive = false;
        this.selectedColor = '#000000'; // Default
        this.selectedBackgroundColor = '#ffffff'; // Default
        this.selectedFontSize = 'medium'; // Default

        while (currentElement && currentElement !== editable) {
          const computedStyle = window.getComputedStyle(currentElement);
          const inlineStyle = currentElement.style; // Direct inline styles

          // Check bold/italic
          if (inlineStyle.fontWeight === 'bold' || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight, 10) >= 700) {
            this.isBoldActive = true;
          }
          if (inlineStyle.fontStyle === 'italic' || computedStyle.fontStyle === 'italic') {
            this.isItalicActive = true;
          }

          // Check text color
          if (inlineStyle.color) { // Prioritize inline style
            this.selectedColor = this.rgbToHex(inlineStyle.color);
          } else if (computedStyle.color && computedStyle.color !== 'rgb(0, 0, 0)') {
            this.selectedColor = this.rgbToHex(computedStyle.color);
          }

          // Check background color
          if (inlineStyle.backgroundColor) { // Prioritize inline style
            this.selectedBackgroundColor = this.rgbToHex(inlineStyle.backgroundColor);
          } else if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgb(0, 0, 0)' && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            this.selectedBackgroundColor = this.rgbToHex(computedStyle.backgroundColor);
          }

          // Check font size
          let currentFontSizePx = '';
          if (inlineStyle.fontSize) { // Prioritize inline style
            currentFontSizePx = inlineStyle.fontSize;
          } else if (computedStyle.fontSize) {
            currentFontSizePx = computedStyle.fontSize;
          }

          if (currentFontSizePx) {
            // Find the key in fontSizeMap that matches the pixel value
            const matchedSizeKey = Object.keys(this.fontSizeMap).find(key => this.fontSizeMap[key] === currentFontSizePx);
            if (matchedSizeKey) {
              this.selectedFontSize = matchedSizeKey;
            } else {
              // If it doesn't match predefined, default or keep current if it's already an explicit px size
              // For robustness, could try to parse px value and categorize. For now, default to 'medium'.
              this.selectedFontSize = 'medium';
            }
          }

          currentElement = currentElement.parentElement;
        }
      } else {
        // No selection or selection is directly in the editable div, reset active states
        this.isBoldActive = false;
        this.isItalicActive = false;
        this.selectedColor = '#000000';
        this.selectedBackgroundColor = '#ffffff';
        this.selectedFontSize = 'medium';
      }
    } else {
      // No selection at all, reset to default states
      this.isBoldActive = false;
      this.isItalicActive = false;
      this.selectedColor = '#000000';
      this.selectedBackgroundColor = '#ffffff';
      this.selectedFontSize = 'medium';
    }
    this.updateSvgColors(); // Update SVG color based on selectedColor state
  }

  // Helper to convert RGB to Hex for color picker display
  private rgbToHex(rgb: string): string {
    const rgba = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+\.?\d*))?\)$/);
    if (!rgba) return rgb; // Return original if not valid rgb/rgba

    const r = parseInt(rgba[1], 10);
    const g = parseInt(rgba[2], 10);
    const b = parseInt(rgba[3], 10);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // General purpose function for applying text styles using document.execCommand
  private applyTextStyle(command: string, value?: string): void {
    this.restoreSelection(); // Restore previous selection or set focus
    const editable = this.editableDiv.nativeElement;
    editable.focus(); // Ensure the div is focused for execCommand to work

    try {
      // Always ensure that styling is applied using CSS, not HTML tags
      document.execCommand('styleWithCSS', false, 'true');
      // Apply the command (e.g., 'bold', 'italic', 'foreColor', 'backColor')
      document.execCommand(command, false, value);
    } catch (e) {
      console.warn(`execCommand failed for ${command}.`, e);
    }
    this.saveSelection(); // Save selection after command
  }

  toggleBold(): void {
    this.isBoldActive = !this.isBoldActive; // Toggle UI state immediately for responsiveness
    this.applyTextStyle('bold');
    // We don't emit for inline styles, as they are part of the content editable's HTML
  }

  toggleItalic(): void {
    this.isItalicActive = !this.isItalicActive; // Toggle UI state immediately
    this.applyTextStyle('italic');
    // We don't emit for inline styles
  }

  changeFontSize(size: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedFontSize = size;
    const pxSize = this.fontSizeMap[size] || '16px';

    this.restoreSelection();
    const editable = this.editableDiv.nativeElement;
    editable.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = this.renderer.createElement('span');
      this.renderer.setStyle(span, 'font-size', pxSize);
      // Explicitly set display to inline to prevent line breaks
      this.renderer.setStyle(span, 'display', 'inline');

      if (!selection.isCollapsed) {
        // Apply to selected text: extract content into span
        this.renderer.appendChild(span, range.extractContents());
        range.deleteContents(); // Remove original content
        range.insertNode(span); // Insert the new span
        selection.removeAllRanges();
        // Restore selection around the newly styled span to keep it selected
        const newRange = document.createRange();
        newRange.selectNodeContents(span); // Select the contents of the span
        selection.addRange(newRange);
      } else {
        // Apply to next typed text: insert a zero-width space to hold the style
        // Check if cursor is already inside a span with the desired font size
        const parentNode = selection.anchorNode?.parentElement;
        if (parentNode && parentNode.tagName === 'SPAN' && parentNode.style.fontSize === pxSize) {
          // Cursor is already in a span with this font size, no need to add new span
        } else {
          // If the current container is the editable div itself and it's empty
          // or if the cursor is at the very beginning of the editable div's content
          if (range.startContainer === editable && editable.childNodes.length === 0 ||
              (range.startContainer === editable && range.startOffset === 0 && editable.firstChild?.nodeType === Node.TEXT_NODE)) {
            this.renderer.appendChild(span, this.renderer.createText('\u200B'));
            this.renderer.appendChild(editable, span);
            selection.collapse(span, 1); // Collapse after ZWS inside the span
          } else {
            // Otherwise, insert at the current cursor position
            this.renderer.appendChild(span, this.renderer.createText('\u200B')); // Zero-width space
            range.insertNode(span);
            selection.collapse(span, 1); // Place cursor inside (after ZWS) the span for next typing
          }
        }
      }
    }
    this.isTextSizeDropdownOpen = false; // Close the dropdown
    this.saveSelection(); // Save selection after operation
  }

  changeTextColor(color: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedColor = color; // Update UI state
    this.applyTextStyle('foreColor', color); // Use execCommand for text color
    this.updateSvgColors(); // Update SVG color
    this.showTextColorInput = false;
  }

  changeBackgroundColor(color: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedBackgroundColor = color; // Update UI state
    this.applyTextStyle('backColor', color); // Use execCommand for text background color
    this.showBackColorInput = false;
  }

  changeBorderColor(color: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedBorderColor = color; // Update UI state

    const editable = this.editableDiv.nativeElement;

    // Border is typically a block-level style, so apply to the entire editable div
    editable.style.borderStyle = 'solid';
    editable.style.borderWidth = '1px';
    editable.style.borderColor = color;

    this.emitStyleState(); // Emit state as this is a container-level style
    this.showBorderColorInput = false;
  }

  changeTextAlign(align: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedTextAlign = align;
    this.editableDiv.nativeElement.style.textAlign = align;
    this.isAlignmentDropdownOpen = false;
    this.emitStyleState(); // Emit state as this is a container-level style
  }

  changeVerticalAlign(align: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedVerticalAlign = align;
    const editable = this.editableDiv.nativeElement;
    editable.style.display = 'flex';
    editable.style.flexDirection = 'column';
    editable.style.justifyContent = this.getFlexValue(align);
    this.isVerticalAlignmentDropdownOpen = false;
    this.emitStyleState(); // Emit state as this is a container-level style
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
    // Only save selection if it's within our editable div
    if (sel && sel.rangeCount > 0 && this.editableDiv?.nativeElement.contains(sel.anchorNode)) {
      this.savedSelection = sel.getRangeAt(0);
    } else {
      this.savedSelection = null; // Clear if no selection or selection is outside the editable div
    }
  }

  restoreSelection(): void {
    if (this.savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(this.savedSelection);
      // Ensure the contenteditable div has focus after restoring selection
      this.editableDiv.nativeElement.focus();
    } else {
      // If no saved selection, just focus the editable div
      this.editableDiv.nativeElement.focus();
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

    this.saveSelection(); // Save selection after link insertion
  }

  onDeleteClick(): void {
    this.deleteClicked.emit();
  }
}