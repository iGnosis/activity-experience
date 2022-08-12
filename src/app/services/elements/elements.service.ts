import { Injectable } from '@angular/core';
import { ElementsObservables, ElementsState } from 'src/app/types/pointmotion';
import { BannerService } from './banner/banner.service';
import { ConfettiService } from './confetti/confetti.service';
import { GuideService } from './guide/guide.service';
import { OverlayService } from './overlay/overlay.service';
import { PromptService } from './prompt/prompt.service';
import { RibbonService } from './ribbon/ribbon.service';
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
    public ribbon: RibbonService,
    public overlay: OverlayService,
    public banner: BannerService,
    public guide: GuideService,
    public confetti: ConfettiService,
  ) {}

  async sleep(timeout: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({});
      }, timeout);
    });
  }

  getElementsObservables(): ElementsObservables {
    return {
      score: this.score.subject,
      timer: this.timer.subject,
      prompt: this.prompt.subject,
      timeout: this.timeout.subject,
      video: this.video.subject,
      ribbon: this.ribbon.subject,
      overlay: this.overlay.subject,
      banner: this.banner.subject,
      guide: this.guide.subject,
      confetti: this.confetti.subject,
    };
  }

  getElementsState(): ElementsState {
    return {
      score: this.score.state,
      timer: this.timer.state,
      prompt: this.prompt.state,
      timeout: this.timeout.state,
      video: this.video.state,
      ribbon: this.ribbon.state,
      overlay: this.overlay.state,
      banner: this.banner.state,
      guide: this.guide.state,
      confetti: this.confetti.state,
    };
  }
}
