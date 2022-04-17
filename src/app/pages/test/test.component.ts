import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { guide } from 'src/app/store/actions/guide.actions';
import { GuideActionShowMessageDTO, GuideState } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss']
})
export class TestComponent implements OnInit {

  showKevin = true
  showMsginCenter = true

  constructor(
    private store: Store<{guide: GuideState}>
  ) { }
  

  ngOnInit(): void {
  }

  changeAvatar() {
    if(this.showKevin) {
      this.store.dispatch(guide.updateAvatar({name: 'kevin', position: 'bottom'}))
    } else {
      this.store.dispatch(guide.updateAvatar({name: 'mila', position: 'center'}))
    }
    this.showKevin = !this.showKevin
  }

  hideAvatar() {
    this.store.dispatch(guide.hideAvatar())
  }

  sendMessage() {
    this.showMsginCenter = !this.showMsginCenter
    if(this.showMsginCenter) {
      this.store.dispatch(guide.sendMessage({position: 'center', text: 'Hello ' + Math.random()}))
    } else {
      this.store.dispatch(guide.sendMessage({position: 'bottom', text: 'Hello ' + Math.random()}))
    }
  }

  hideMessage() {
    this.store.dispatch(guide.hideMessage())
  }

  sendSpotlight() {
    this.store.dispatch(guide.sendSpotlight({text: 'some text ' + Math.random()}))
  }

  hideSpotlight() {
    this.store.dispatch(guide.hideSpotlight())
  }
}
