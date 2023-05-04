import { Injectable } from '@angular/core';
import { ElementsObservables, ElementsState } from 'src/app/types/pointmotion';
import { BannerService } from './banner/banner.service';
import { CalibrationTutorialService } from './calibration-tutorial/calibration-tutorial.service';
import { TitleBarService } from './title-bar/title-bar.service';
import { GoalSelectionService } from './goal-selection/goal-selection.service';
import { UnlockNotificationService } from './unlock-notification/unlock-notification.service';
import { ConfettiService } from './confetti/confetti.service';
import { GameMenuService } from './game-menu/game-menu.service';
import { GuideService } from './guide/guide.service';
import { HealthService } from './health/health.service';
import { OverlayService } from './overlay/overlay.service';
import { PromptService } from './prompt/prompt.service';
import { RibbonService } from './ribbon/ribbon.service';
import { ScoreService } from './score/score.service';
import { TimeoutService } from './timeout/timeout.service';
import { TimerService } from './timer/timer.service';
import { ToastService } from './toast/toast.service';
import { VideoService } from './video/video.service';

@Injectable({
  providedIn: 'root',
})
export class ElementsService {
  constructor(
    public titleBar: TitleBarService,
    public goalSelection: GoalSelectionService,
    public unlockNotification: UnlockNotificationService,
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
    public toast: ToastService,
    public calibrationTutorialService: CalibrationTutorialService,
    public health: HealthService,
    public gameMenu: GameMenuService,
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
      titleBar: this.titleBar.subject,
      goalSelection: this.goalSelection.subject,
      unlockNotification: this.unlockNotification.subject,
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
      toast: this.toast.subject,
      calibrationTutorial: this.calibrationTutorialService.subject,
      health: this.health.subject,
      gameMenu: this.gameMenu.subject,
    };
  }

  getElementsState(): ElementsState {
    return {
      titleBar: this.titleBar.state,
      goalSelection: this.goalSelection.state,
      unlockNotification: this.unlockNotification.state,
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
      toast: this.toast.state,
      calibrationTutorial: this.calibrationTutorialService.state,
      health: this.health.state,
      gameMenu: this.gameMenu.state,
    };
  }
}
