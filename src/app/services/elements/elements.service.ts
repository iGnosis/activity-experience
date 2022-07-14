import { Injectable } from '@angular/core';
import { ElementsObservables, ElementsState } from 'src/app/types/pointmotion';
import { PromptService } from './prompt/prompt.service';
import { ScoreService } from './score/score.service';
import { TimeoutService } from './timeout/timeout.service';
import { TimerService } from './timer/timer.service';
import { VideoService } from './video/video.service';

@Injectable({
  providedIn: 'root',
})
export class ElementsService {
  constructor(
    public score: ScoreService,
    public timer: TimerService,
    public prompt: PromptService,
    public timeout: TimeoutService,
    public video: VideoService,
  ) {}

  getElementsObservables(): ElementsObservables {
    return {
      score: this.score.subject,
      timer: this.timer.subject,
      prompt: this.prompt.subject,
      timeout: this.timeout.subject,
      video: this.video.subject,
    };
  }

  getElementsState(): ElementsState {
    return {
      score: this.score.state,
      timer: this.timer.state,
      prompt: this.prompt.state,
      timeout: this.timeout.state,
      video: this.video.state,
    };
  }
}
