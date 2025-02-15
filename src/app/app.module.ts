import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';


import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { PopupResponseComponent } from './shared/popup-response/popup-response.component';
import { tokenInterceptor } from './services/token.interceptor';
import { NavBarComponent } from './shared/nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { AssignedTasksComponent } from './shared/assigned-tasks/assigned-tasks.component';
import { MyTasksComponent } from './my-tasks/my-tasks.component';

@NgModule({
  declarations: [
    AppComponent,
    PopupResponseComponent,
    NavBarComponent,
    AssignedTasksComponent,
    MyTasksComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
  ],
  providers: [provideHttpClient(withInterceptors([tokenInterceptor]))],
  bootstrap: [AppComponent]
})
export class AppModule { }
