import { Component } from '@angular/core';
import { PopupService } from '../../services/popup.service';

@Component({
  selector: 'app-popup-response',
  templateUrl: './popup-response.component.html',
  styles: ``
})
export class PopupResponseComponent {

  constructor(public popup:PopupService){}

}
