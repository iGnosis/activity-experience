import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { TimeoutService } from 'src/app/services/elements/timeout/timeout.service';
import { ElementAttributes, TimeoutColor, TimeoutElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-timeout',
  templateUrl: './timeout.component.html',
  styleUrls: ['./timeout.component.scss'],
  animations: [
    trigger('timeOut', [
      transition(':enter', [
        animate(
          '{{duration}}ms linear',
          keyframes([style({ width: '0%' }), style({ width: '100%' })]),
        ),
      ]),
    ]),
  ],
})
export class TimeoutComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  state: TimeoutElementState;
  attributes: ElementAttributes;
  source: Observable<number>;
  timer: Subscription;
  isTimeOutRunning = false;

  colors: { [key in TimeoutColor]: string } = {
    yellow: '#ffb000',
    red: '#EB0000',
    blue: '#2F51AE',
  };

  constructor(private timeoutService: TimeoutService) {}
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.timeoutService.subject.subscribe((state) => {
      this.state = state.data;
      this.attributes = state.attributes;
      const { mode, timeout } = state.data;
      switch (mode) {
        case 'start':
          if (timeout) {
            this.handleStartTimer(timeout);
          }
          break;
        case 'stop':
          this.handleStopTimer();
          break;
      }
    });
  }

  handleStartTimer(timeOutDuration: number) {
    if (this.isTimeOutRunning) {
      return;
    }
    this.source = timer(0, 1000);
    console.log('timer Started');
    this.isTimeOutRunning = true;
    this.timer = this.source.subscribe((val) => {
      if (val * 1000 >= timeOutDuration) {
        this.handleStopTimer();
      }
    });
  }

  handleStopTimer() {
    if (!this.isTimeOutRunning) {
      return;
    }
    this.timer && this.timer.unsubscribe();
    this.isTimeOutRunning = false;
    this.timeoutService.hide();
    console.log('timer stopped');
  }
}
