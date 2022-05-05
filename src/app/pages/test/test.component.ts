import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { guide } from 'src/app/store/actions/guide.actions';
import { GuideActionShowMessageDTO, GuideState } from 'src/app/types/pointmotion';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
})
export class TestComponent implements OnInit {
  showKevin = true;
  showMsginCenter = true;

  constructor(private store: Store<{ guide: GuideState }>) {}

  ngOnInit(): void {}

  changeAvatar() {
    if (this.showKevin) {
      this.store.dispatch(guide.updateAvatar({ name: 'kevin', position: 'bottom' }));
    } else {
      this.store.dispatch(guide.updateAvatar({ name: 'mila', position: 'center' }));
    }
    this.showKevin = !this.showKevin;
  }

  hideAvatar() {
    this.store.dispatch(guide.hideAvatar());
  }

  sendMessage() {
    this.showMsginCenter = !this.showMsginCenter;
    if (this.showMsginCenter) {
      this.store.dispatch(
        guide.sendMessage({
          position: 'center',
          text: 'Hello ' + Math.random(),
        }),
      );
    } else {
      this.store.dispatch(
        guide.sendMessage({
          position: 'bottom',
          text: 'Hello ' + Math.random(),
        }),
      );
    }
  }

  hideMessage() {
    this.store.dispatch(guide.hideMessage());
  }

  sendSpotlight() {
    this.store.dispatch(guide.sendSpotlight({ text: 'some text ' + Math.random() }));
  }

  hideSpotlight() {
    this.store.dispatch(guide.hideSpotlight());
  }

  sendPromptWithIcon() {
    this.store.dispatch(
      guide.sendPrompt({
        icon: faArrowLeft,
        position: 'right',
        text: 'Move Left',
      }),
    );
  }

  sendPromptWithNumber() {
    // Change position each time
    this.store.dispatch(guide.sendPrompt({ position: 'center', text: '2', className: 'round' }));
  }

  hidePrompt() {
    this.store.dispatch(guide.hidePrompt());
  }

  startTimer() {
    this.store.dispatch(guide.startTimer({timeout: 5000}))
  }

  hideTimer() {
    this.store.dispatch(guide.hideTimer())
  }
}
