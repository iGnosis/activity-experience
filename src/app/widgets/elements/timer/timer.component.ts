import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, timer } from 'rxjs';
import { TimerService } from 'src/app/services/elements/timer/timer.service';
import { ElementAttributes } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
  duration: number;
  lable: string;
  interval: any;
  isTimerRunning = false;
  isPaused = false;
  elapsedTime = 0;
  subscription: Subscription;
  source: Observable<number>;
  timer: Subscription;
  attributes: ElementAttributes;
  isCountdown: boolean;
  intermediateFns?: { [key: number]: () => void };
  onComplete?: (elapsedTime: number) => void;
  onPause?: (elapsedTime: number) => void;
  constructor(private timerService: TimerService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  time: { minutes: string; seconds: string } = { minutes: '0', seconds: '00' };
  totalSeconds = 0;
  ngOnInit(): void {
    this.subscription = this.timerService._subject.subscribe((state) => {
      this.attributes = state.attributes;
      const { mode, duration, isCountdown, onComplete, onPause, intermediateFns } = state.data;
      if (typeof isCountdown === 'boolean') {
        this.isCountdown = isCountdown;
      } else {
        this.isCountdown = false;
      }
      switch (mode) {
        case 'start':
          if (duration) {
            this.duration = duration;
            this.startTimer(duration);
          }
          break;
        case 'pause':
          this.pauseTimer();
          break;
        case 'resume':
          this.resumeTimer();
          break;
        case 'stop':
          this.stopTimer();
          break;
      }
      if (onComplete) {
        this.onComplete = onComplete;
      }
      if (onPause) {
        this.onPause = onPause;
      }
      if (intermediateFns) {
        this.intermediateFns = intermediateFns;
      } else {
        this.intermediateFns = undefined;
      }
    });
  }

  startTimer(duration: number) {
    if (this.isTimerRunning) {
      return;
    }
    this.isTimerRunning = true;
    this.source = timer(0, 1000);
    this.timer = this.source.subscribe((val) => {
      this.elapsedTime += 1;
      if (this.intermediateFns && this.intermediateFns[this.elapsedTime]) {
        this.intermediateFns[this.elapsedTime]();
      }
      if (this.isCountdown) {
        this.updateTimer(this.duration / 1000 - val);
      } else {
        this.updateTimer(val);
      }
      if (val * 1000 >= duration) {
        this.stopTimer();
      }
    });
  }

  stopTimer() {
    const elapsedTime = this.elapsedTime;
    this.elapsedTime = 0;
    this.timer.unsubscribe();
    this.isTimerRunning = false;
    this.onComplete && this.onComplete(elapsedTime);
  }

  resumeTimer() {
    if (!this.isTimerRunning || !this.isPaused) {
      return;
    }
    this.isPaused = false;
    const prevElapsedTime = this.elapsedTime;
    this.timer = this.source.subscribe((val) => {
      this.elapsedTime += 1;
      if (this.intermediateFns && this.intermediateFns[this.elapsedTime]) {
        this.intermediateFns[this.elapsedTime]();
      }
      if (this.isCountdown) {
        this.updateTimer(this.duration / 1000 - (val + prevElapsedTime));
      } else {
        this.updateTimer(val + prevElapsedTime);
      }
      if ((prevElapsedTime + val) * 1000 >= this.duration) {
        this.stopTimer();
      }
    });
  }

  pauseTimer() {
    if (!this.isTimerRunning || this.isPaused) {
      return;
    }
    this.isPaused = true;
    this.onPause && this.onPause(this.elapsedTime);
    this.timer.unsubscribe();
  }

  updateTimer(totalSeconds: number) {
    let minutes = 0;
    if (totalSeconds >= 60) {
      minutes = Math.floor(totalSeconds / 60);
      totalSeconds -= 60 * minutes;
    }
    this.time = {
      minutes:
        minutes < 10
          ? (this.time.minutes = '0' + minutes.toString())
          : (this.time.minutes = minutes.toString()),
      seconds:
        totalSeconds < 10
          ? (this.time.seconds = '0' + totalSeconds.toString())
          : (this.time.seconds = totalSeconds.toString()),
    };
  }
}
