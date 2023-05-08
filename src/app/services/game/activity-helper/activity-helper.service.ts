import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { game } from 'src/app/store/actions/game.actions';
import {
  Activities,
  GameMenuElementState,
  GameState,
  HandTrackerStatus,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { GoogleAnalyticsService } from '../../google-analytics/google-analytics.service';
import { TtsService } from '../../tts/tts.service';
import { GqlClientService } from '../../gql-client/gql-client.service';
import { Metrics } from 'src/app/types/enum';

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
    private handTrackerService: HandTrackerService,
    private gqlService: GqlClientService,
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

  async exitOrReplay(reCalibrationCount?: number) {
    // show the menu
    const gameMenuState: Partial<GameMenuElementState> = {
      holdDuration: 2000,
      timeoutDuration: 15_000,
      leftTitle: 'Select Activity',
      rightTitle: 'Replay',
    };
    this.elements.gameMenu.state = {
      data: {
        ...gameMenuState,
        gesture: undefined,
        onLeft: () => {
          window.parent.postMessage(
            {
              type: 'end-game',
            },
            '*',
          );
        },
      },
      attributes: {
        visibility: 'visible',
        reCalibrationCount,
      },
    };
    await this.elements.sleep(600);
    // show guide message
    this.ttsService.tts('Move your hands to one of the sides to make a selection.');
    this.elements.guide.state = {
      data: {
        title: 'Move your hands to one of the sides to make a selection.',
        showIndefinitely: true,
      },
      attributes: {
        visibility: 'visible',
        reCalibrationCount,
      },
    };
    await new Promise((resolve) => {
      const handSubscription = this.handTrackerService.sidewaysGestureResult
        .pipe(debounceTime(200), distinctUntilChanged())
        .subscribe((status: HandTrackerStatus) => {
          this.elements.gameMenu.state = {
            data: {
              ...gameMenuState,
              gesture: status,
              onLeft: () => {
                handSubscription.unsubscribe();
                window.parent.postMessage(
                  {
                    type: 'end-game',
                  },
                  '*',
                );
              },
              onRight: () => {
                handSubscription.unsubscribe();
                console.log('sideways-status::replay');
                resolve({});
              },
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
        });
    });
    this.elements.gameMenu.hide();
    this.elements.guide.hide();
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

  humanizeWord(str: string) {
    const words = str.split('_');
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    return words.join(' ');
  }

  async updateUserContext(metrics: Metrics[]) {
    const query = `mutation UpdatePatientContext($metrics: [MetricEnum!]!) {
      updatePatientContext(metrics: {metrics: $metrics}) {
        data
      }
    }`;
    await this.gqlService.req(query, { metrics });
  }
}
