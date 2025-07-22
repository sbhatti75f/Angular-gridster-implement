import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';
import { FormsModule } from '@angular/forms';
import { GridsterModule } from 'angular-gridster2';
import { GridsterWrapperComponent } from './gridster-wrapper/gridster-wrapper.component';
import { TextBarComponent } from './text-bar/text-bar.component';
import { TextAreaComponent } from './text-area/text-area.component';
import { ImageBarComponent } from './image-bar/image-bar.component';
import { ImageAreaComponent } from './image-area/image-area.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    GridsterWrapperComponent,
    TextBarComponent,
    TextAreaComponent,
    ImageBarComponent,
    ImageAreaComponent
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


