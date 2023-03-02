import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { game } from 'src/app/store/actions/game.actions';
import { Activities, GameState, PreferenceState } from 'src/app/types/pointmotion';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { GoogleAnalyticsService } from '../../google-analytics/google-analytics.service';
import { TtsService } from '../../tts/tts.service';

@Injectable({
  providedIn: 'root',
})
export class ActivityHelperService {
  public isLastActivity = false;

  constructor(
    private ttsService: TtsService,
    private elements: ElementsService,
    private googleAnalyticsService: GoogleAnalyticsService,
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private gameStateService: GameStateService,
  ) {}

  /**
   * Takes in the time (in seconds) and converts it into an object with minutes and seconds
   *
   * @param {number} totalSeconds
   * @returns {{ minutes: string; seconds: string; }}
   */
  getDurationForTimer(totalSeconds: number): {
    minutes: string;
    seconds: string;
  } {
    let minutes = 0;
    if (totalSeconds >= 60) {
      minutes = Math.floor(totalSeconds / 60);
      totalSeconds -= 60 * minutes;
    }
    let time = { minutes: '0', seconds: '00' };
    time = {
      minutes:
        minutes < 10
          ? (time.minutes = '0' + minutes.toString())
          : (time.minutes = minutes.toString()),
      seconds:
        totalSeconds < 10
          ? (time.seconds = '0' + totalSeconds.toString())
          : (time.seconds = totalSeconds.toString()),
    };
    return time;
  }

  /**
   * Exits the current activity and returns to the home screen
   *
   * @param {Activities} activityName
   * @param {number} reCalibrationCount?
   * @returns {Promise<void>}
   */
  async exitGame(activityName: Activities, reCalibrationCount?: number): Promise<void> {
    this.store.dispatch(game.gameCompleted());
    this.googleAnalyticsService.sendEvent('level_end', {
      level_name: activityName,
    });
    await this.gameStateService.postLoopHook();
    this.elements.guide.state = {
      data: {
        title: "Great job on the progress you've made today. I hope to see you back very soon.",
        showIndefinitely: true,
      },
      attributes: {
        visibility: 'visible',
        reCalibrationCount,
      },
    };
    await this.ttsService.tts(
      "Great job on the progress you've made today. I hope to see you back very soon.",
    );
    await this.elements.sleep(10000);
    this.elements.guide.state.attributes = {
      visibility: 'hidden',
      reCalibrationCount,
    };

    window.parent.postMessage(
      {
        type: 'end-game',
      },
      '*',
    );
  }

  /**
   * Calculating the distance between two points.
   * distance = √[(x2 – x1)^2 + (y2 – y1)^2]
   *
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @returns {number}
   */
  calcDist(x1: number, y1: number, x2: number, y2: number): number {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    return distance;
  }
}
