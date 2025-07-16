import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { FormsModule } from '@angular/forms';
import { TextComponent } from './text/text.component';
import { GridsterModule } from 'angular-gridster2';
import { GridsterWrapperComponent } from './gridster-wrapper/gridster-wrapper.component';
import { ImageComponent } from './image/image.component';
import { TextBarComponent } from './text-bar/text-bar.component';
import { TextAreaComponent } from './text-area/text-area.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    TextComponent,
    GridsterWrapperComponent,
    ImageComponent,
    TextBarComponent,
    TextAreaComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    GridsterModule,
    CommonModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }


