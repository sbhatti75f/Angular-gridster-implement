import { Component, ViewChild, ElementRef, Renderer2, AfterViewInit, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-text-bar',
  templateUrl: './text-bar.component.html',
  styleUrls: ['./text-bar.component.css']
})
export class TextBarComponent implements OnChanges, AfterViewInit {
     @ViewChild('textColorIcon') textColorIcon!: ElementRef<SVGSVGElement>;

  @Input() editableDiv!: ElementRef;
  @Input() styleState: any;
  @Output() styleChanged = new EventEmitter<any>();

  isBoldActive = false;
  isItalicActive = false;
  selectedColor = '#000000';
  selectedBackgroundColor = '#ffffff';
  selectedBorderColor = '#cccccc';
  selectedTextAlign = 'left';
  selectedVerticalAlign = 'top';
  selectedFontSize = 'medium';

  showTextColorInput = false;
  showBackColorInput = false;
  showBorderColorInput = false;

  private savedSelection: Range | null = null;

  private fontSizeMap: { [key: string]: string } = {
    small: '12px',
    medium: '16px',
    large: '24px',
    xlarge: '32px'
  };

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['styleState'] && this.styleState && this.editableDiv) {
      this.applyStyleStateToUI(this.styleState);
    }
  }

  ngAfterViewInit(): void {
    if (this.styleState && this.editableDiv) {
      setTimeout(() => {
        this.applyStyleStateToUI(this.styleState);
        this.initializeToolbar(); // ✅ CALL IT HERE
      }, 0);
    }
  }


  private applyStyleStateToUI(state: any): void {
    const editable = this.editableDiv?.nativeElement;
    if (!editable) return;

    editable.style.fontWeight = state.fontWeight || 'normal';
    editable.style.fontStyle = state.fontStyle || 'normal';
    editable.style.fontSize = this.fontSizeMap[state.fontSize || 'medium'];
    editable.style.textAlign = state.textAlign || 'left';
    editable.style.color = state.color || '#000000';
    editable.style.backgroundColor = state.backgroundColor || '#ffffff';
    editable.style.borderColor = state.borderColor || '#cccccc';
    editable.style.display = 'flex';
    editable.style.flexDirection = 'column';
    editable.style.justifyContent = this.getFlexValue(state.verticalAlign || 'top');

    this.isBoldActive = state.fontWeight === 'bold';
    this.isItalicActive = state.fontStyle === 'italic';
    this.selectedFontSize = state.fontSize || 'medium';
    this.selectedColor = state.color || '#000000';
    this.selectedBackgroundColor = state.backgroundColor || '#ffffff';
    this.selectedBorderColor = state.borderColor || '#cccccc';
    this.selectedTextAlign = state.textAlign || 'left';
    this.selectedVerticalAlign = state.verticalAlign || 'top';
  }

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

  toggleBold(): void {
    this.isBoldActive = !this.isBoldActive;
    this.editableDiv.nativeElement.style.fontWeight = this.isBoldActive ? 'bold' : 'normal';
    this.emitStyleState();
  }

  toggleItalic(): void {
    this.isItalicActive = !this.isItalicActive;
    this.editableDiv.nativeElement.style.fontStyle = this.isItalicActive ? 'italic' : 'normal';
    this.emitStyleState();
  }

  changeFontSize(size: string): void {
    this.selectedFontSize = size;
    const pxSize = this.fontSizeMap[size] || '16px';
    this.editableDiv.nativeElement.style.fontSize = pxSize;
    this.emitStyleState();
  }

  changeTextColor(color: string): void {
    this.selectedColor = color;
    this.editableDiv.nativeElement.style.color = color;

    const iconSvg = this.textColorIcon?.nativeElement;
    const useTag = iconSvg?.querySelector('use');
    if (iconSvg && useTag) {
      iconSvg.style.fill = color;
      useTag.setAttribute('fill', color);
    }

    this.emitStyleState();
  }

  changeBackgroundColor(color: string): void {
    this.selectedBackgroundColor = color;
    this.editableDiv.nativeElement.style.backgroundColor = color;
    this.emitStyleState();
  }

  changeBorderColor(color: string): void {
    this.selectedBorderColor = color;
    this.editableDiv.nativeElement.style.borderColor = color;
    this.emitStyleState();
  }

  changeTextAlign(align: string): void {
    this.selectedTextAlign = align;
    this.editableDiv.nativeElement.style.textAlign = align;
    this.emitStyleState();
  }

  changeVerticalAlign(align: string): void {
    this.selectedVerticalAlign = align;
    const editable = this.editableDiv.nativeElement;
    editable.style.display = 'flex';
    editable.style.flexDirection = 'column';
    editable.style.justifyContent = this.getFlexValue(align);
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

  handleColorIconClick(type: 'text' | 'background' | 'border') {
    this.showTextColorInput = type === 'text';
    this.showBackColorInput = type === 'background';
    this.showBorderColorInput = type === 'border';
  }

    private initializeToolbar(): void {
      this.setupSvgClickToggles();
      this.setupDropdowns();
      this.setupStyleButtons();
      this.setupDeleteHandler();

      this.renderer.listen(this.editableDiv.nativeElement, 'mouseup', () => {
        this.saveSelection();
      });
      this.renderer.listen(this.editableDiv.nativeElement, 'keyup', () => {
        this.saveSelection();
      });

      this.renderer.listen(this.editableDiv.nativeElement, 'click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'A') {
          event.preventDefault();
          const url = (target as HTMLAnchorElement).href;
          window.open(url, '_blank');
        }
      });

    this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const clickedEl = event.target as HTMLElement;
      if (
        !clickedEl.closest('.text-color') &&
        !clickedEl.closest('.text-color-input') &&
        !clickedEl.closest('.backcolor') &&
        !clickedEl.closest('.body-color-input') &&
        !clickedEl.closest('.border-fill') &&
        !clickedEl.closest('.border-color-input')
      ) {
        this.showTextColorInput = false;
        this.showBackColorInput = false;
        this.showBorderColorInput = false;
      }
    });
  }

    /*************************************************/

    private setupSvgClickToggles(): void {
      const icons = document.querySelectorAll('.svg-default');
      icons.forEach(icon => {
        this.renderer.listen(icon, 'click', (e: Event) => {
          icon.classList.toggle('active');
        });
      });
    }

    applyTextColor(): void {
      this.restoreSelection();
      const editable = this.editableDiv.nativeElement;
      editable.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, this.selectedColor);
      } else {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.color = this.selectedColor;
        span.appendChild(range.extractContents());
        range.deleteContents();
        range.insertNode(span);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      const iconSvg = this.textColorIcon.nativeElement;
      const useTag = iconSvg.querySelector('use');
      if (useTag) {
        iconSvg.style.fill = this.selectedColor;
        useTag.setAttribute('fill', this.selectedColor);
      }

      const dashes = document.querySelectorAll('svg[id^="dash"] use');
      dashes.forEach((useEl) => {
        (useEl as SVGUseElement).setAttribute('fill', this.selectedColor);
      });
      this.emitStyleState();
    }

    applyBackgroundColor(): void {
      this.editableDiv.nativeElement.style.backgroundColor = this.selectedColor;
    }

    applyBorderColor(): void {
      this.editableDiv.nativeElement.style.border = `2px solid ${this.selectedColor}`;
    }

    // Text style buttons (bold/italic)
    private setupStyleButtons(): void {
      this.restoreSelection();
      const editable = this.editableDiv.nativeElement;

      const boldButton = document.querySelector('.bold') as HTMLElement;
      const italicButton = document.querySelector('.italic') as HTMLElement;

      if (boldButton) {
        this.renderer.listen(boldButton, 'click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyTextStyle('fontWeight', this.isBoldActive ? 'normal' : 'bold');
          this.isBoldActive = !this.isBoldActive;
          boldButton.classList.toggle('active', this.isBoldActive);
        });
      }

      if (italicButton) {
        this.renderer.listen(italicButton, 'click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          this.applyTextStyle('fontStyle', this.isItalicActive ? 'normal' : 'italic');
          this.isItalicActive = !this.isItalicActive;
          italicButton.classList.toggle('active', this.isItalicActive);
        });
      }
    }

    private applyTextStyle(styleProperty: string, styleValue: string): void {
      this.restoreSelection();
      const editable = this.editableDiv.nativeElement;
      editable.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        const command = styleProperty === 'fontWeight' ? 'bold' : 'italic';
        document.execCommand(command, false, undefined);
        return;
      }

      const range = selection.getRangeAt(0);
      if (selection.isCollapsed) {
        const command = styleProperty === 'fontWeight' ? 'bold' : 'italic';
        document.execCommand(command, false, undefined);
      } else {
        const selectedContent = range.extractContents();
        const wrapper = document.createElement('span');
        (wrapper.style as any)[styleProperty] = styleValue;
        wrapper.appendChild(selectedContent);
        range.insertNode(wrapper);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Dropdowns (text size, alignment)
    private setupDropdowns(): void {
      // Text size
      const textSizeControl = document.querySelector('.text-size') as HTMLElement;
      const currentTextSize = textSizeControl?.querySelector('.svg-default');

      this.renderer.listen(textSizeControl, 'click', (e: Event) => {
        e.stopPropagation();
        textSizeControl.classList.toggle('active');
      });

      this.renderer.listen('document', 'click', () => {
        textSizeControl?.classList.remove('active');
      });

      document.querySelectorAll('.size-option').forEach(option => {
        this.renderer.listen(option, 'click', (e: Event) => {
          e.stopPropagation();
          const size = option.getAttribute('data-size');
          const sizes: any = {
            small: '10px',
            medium: '14px',
            large: '18px'
          };
          const template = option.querySelector('.replacement-icon');
          if (template && currentTextSize) {
            currentTextSize.innerHTML = template.innerHTML;
          }
          if (this.editableDiv?.nativeElement) {
            this.editableDiv.nativeElement.style.fontSize = sizes[size || 'medium'];
          }
          textSizeControl.classList.remove('active');
        });
      });

      // Horizontal alignment
      const alignmentControl = document.querySelector('.alignment') as HTMLElement;
      const currentAlignIcon = alignmentControl?.querySelector('.svg-default');
      const alignOptions = document.querySelectorAll('.align-option');

      if (alignmentControl) {
        this.renderer.listen(alignmentControl, 'click', (e: Event) => {
          e.stopPropagation();
          alignmentControl.classList.toggle('active');
        });

        this.renderer.listen('document', 'click', () => {
          alignmentControl?.classList.remove('active');
        });

        alignOptions.forEach(option => {
          this.renderer.listen(option, 'click', (e: Event) => {
            e.stopPropagation();
            const alignType = option.getAttribute('data-align');
            const replacement = option.querySelector('.replacement-icon');

            if (replacement && currentAlignIcon) {
              currentAlignIcon.innerHTML = replacement.innerHTML;
            }

           if (this.editableDiv?.nativeElement && alignType) {
            const alignTextMap: any = {
              left: 'left',
              center: 'center',
              right: 'right'
            };

            const editable = this.editableDiv.nativeElement;
            editable.style.textAlign = alignTextMap[alignType];
          }
            

            alignmentControl.classList.remove('active');
          });
        });
      }


      // Vertical alignment
      const vAlignControl = document.querySelector('.vertical-alignment') as HTMLElement;
      const currentVAlignIcon = vAlignControl?.querySelector('.svg-default');
      const vAlignOptions = document.querySelectorAll('.v-align-option');

      if (vAlignControl) {
        this.renderer.listen(vAlignControl, 'click', (e: Event) => {
          e.stopPropagation();
          vAlignControl.classList.toggle('active');
        });

        this.renderer.listen('document', 'click', () => {
          vAlignControl?.classList.remove('active');
        });

        vAlignOptions.forEach(option => {
          this.renderer.listen(option, 'click', (e: Event) => {
            e.stopPropagation();
            const valignType = option.getAttribute('data-valign');
            const replacement = option.querySelector('.replacement-icon');

            if (replacement && currentVAlignIcon) {
              currentVAlignIcon.innerHTML = replacement.innerHTML;
            }

            if (this.editableDiv?.nativeElement && valignType) {
              const valignMap: any = {
                top: 'flex-start',
                middle: 'center',
                bottom: 'flex-end'
              };

              const editable = this.editableDiv.nativeElement;
              editable.style.display = 'flex';
              editable.style.flexDirection = 'column';
              editable.style.justifyContent = valignMap[valignType];
            }

            vAlignControl.classList.remove('active');
          });
        });
      }
    }

    //Link 
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
      const anchor = document.createElement('a');
      anchor.href = url.startsWith('http') ? url : 'https://' + url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.style.textDecoration = 'underline';

      anchor.textContent = range.toString(); // preserve original text

      // Replace selected text with the anchor element
      range.deleteContents();
      range.insertNode(anchor);

      // Collapse selection after inserted link
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.setStartAfter(anchor);
      newRange.collapse(true);
      selection.addRange(newRange);
    }


    // Delete Button
    private setupDeleteHandler(): void {
      const deleteButton = document.querySelector('.deleting');

      this.renderer.listen(deleteButton, 'click', () => {
        const editable = this.editableDiv.nativeElement;

        //  Clear content
        editable.innerHTML = '';

        //  Reset inline styles
        editable.removeAttribute('style');

        //  Reset selected color
        this.selectedColor = '#000000';

        //  Reset bold/italic button states (functionally and visually)
        this.isBoldActive = false;
        this.isItalicActive = false;

        const boldBtn = document.querySelector('.bold');
        const italicBtn = document.querySelector('.italic');
        boldBtn?.classList.remove('active');
        italicBtn?.classList.remove('active');

        //  Reset horizontal alignment icon
        const alignControl = document.querySelector('.alignment') as HTMLElement;
        const alignIcon = alignControl?.querySelector('.svg-default');
        alignControl?.classList.remove('active');
        if (alignIcon) {
          alignIcon.innerHTML = `
            <svg width="60" height="32">
              <use xlink:href="assets/icons.svg#align-default"></use>
            </svg>
          `;
        }

        // Reset vertical alignment icon
        const vAlignControl = document.querySelector('.vertical-alignment') as HTMLElement;
        const vAlignIcon = vAlignControl?.querySelector('.svg-default');
        vAlignControl?.classList.remove('active');
        if (vAlignIcon) {
          vAlignIcon.innerHTML = `
            <svg width="60" height="32">
              <use xlink:href="assets/icons.svg#valign-default"></use>
            </svg>
          `;
        }

        const textSizeControl = document.querySelector('.text-size') as HTMLElement;
        const sizeIcon = textSizeControl?.querySelector('.svg-default');
        textSizeControl?.classList.remove('active');
        if (sizeIcon) {
          sizeIcon.innerHTML = `
            <svg width="60" height="32">
                <use xlink:href="assets/icons.svg#text-size-default"></use>
            </svg>
          `;
        }

        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

        const colorIcons = document.querySelectorAll('svg use');
        colorIcons.forEach((useEl) => {
          (useEl as SVGUseElement).setAttribute('fill', '#000000');
        });

      });
    }
  }




