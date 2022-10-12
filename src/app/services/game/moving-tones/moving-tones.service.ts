import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import {
  ActivityBase,
  AnalyticsDTO,
  GameState,
  Genre,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';
import { GameStateService } from '../../game-state/game-state.service';
import { SoundsService } from '../../sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { game } from 'src/app/store/actions/game.actions';
import { TtsService } from '../../tts/tts.service';
import { CheckinService } from '../../checkin/checkin.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class MovingTonesService implements ActivityBase {
  private isServiceSetup = false;
  private genre: Genre = 'jazz';
  private successfulReps = 0;
  private failedReps = 0;
  private totalReps = 0;
  private globalReCalibrationCount: number;
  private config = {
    gameDuration: environment.settings['moving_tones'].configuration.gameDuration,
    speed: environment.settings['moving_tones'].configuration.speed,
  };

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private gameStateService: GameStateService,
    private handTrackerService: HandTrackerService,
    private soundsService: SoundsService,
    private ttsService: TtsService,
    private calibrationService: CalibrationService,
    private checkinService: CheckinService,
  ) {
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.soundsService.loadMusicFiles(this.genre);
        }
      });
    this.calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
  }

  welcome() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Last activity. Moving Tones.');
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Last Activity</h2>
              <h1 class="pt-6 display-4">Moving Tones</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="py-2">Range of Motion</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Moving Tones',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          'Make sure to have your fingers stretched while playing this game. Keep an upright posture and stay big. Move your feet if required to reach the objects on the screen.',
        );
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            cards: [
              {
                icon: '/assets/images/overlay_icons/no-chair.png',
                message: 'Fingers stretched wide',
              },
              {
                icon: '/assets/images/overlay_icons/space-to-move.png',
                message: 'Posture upright and big',
              },
              {
                icon: '/assets/images/overlay_icons/stand-up.png',
                message: 'Move feet to reach objects',
              },
            ],
            transitionDuration: 4000,
          },
        };
        await this.elements.sleep(18000);
      },
    ];
  }
  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Raise one of your hands to start the tutorial.');
        this.elements.guide.state = {
          data: {
            title: 'Raise one of your hands to start the tutorial.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('any-hand');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(2000);
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Red for Right Hand',
            description:
              'Hold the right hand over the red circle when it first appears on the screen to load the music coins.',
            src: 'assets/images/beat-boxer/red-bag.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Hold the right hand over the red circle when it first appears, to load the music coins.',
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        // Todo: 1 rep right hand
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Now let's try the other hand.");
        this.elements.guide.state = {
          data: {
            title: "Now let's try the other hand.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Blue for Left Hand',
            description:
              'Hold the left hand over the blue circle when it first appears on the screen to load the music coins.',
            src: 'assets/images/beat-boxer/red-bag.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Hold the left hand over the blue circle when it first appears, to load the music coins.',
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        // Todo: 1 rep left hand
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's try with both hands now.");
        this.elements.guide.state = {
          data: {
            title: "Let's try with both hands now.",
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);
        // 1 rep both hands
      },
      async (reCalibrationCount: number) => {
        this.elements.video.state = {
          data: {
            type: 'gif',
            title: 'Collect the Coins!',
            description:
              'Follow your hand over the music coins to collect them and finish on the same colour you started with.',
            src: 'assets/images/beat-boxer/red-bag.png',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        this.ttsService.tts(
          'Follow your hand over the music coins to collect them and finish on the same colour on which you started.',
        );
        await this.elements.sleep(6000);
        this.elements.video.state = {
          data: {},
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        // 1 full rep both hands
        this.ttsService.tts('Well done!');
        this.elements.guide.state = {
          data: {
            title: 'Well done!',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
    ];
  }
  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts("You're ready to start collecting some music coins.");
        this.elements.guide.state = {
          data: {
            title: "You're ready to start collecting some music coins.",
            titleDuration: 3500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);
        this.ttsService.tts('Tutorial Completed.');
        this.elements.guide.state = {
          data: {
            title: 'Tutorial Completed.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
    ];
  }
  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts("Let's begin.");
        this.elements.guide.state = {
          data: {
            title: "Let's begin.",
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
        // game starts
        // times up banner element
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          'Raise both your hands if you want to add 30 more seconds to this activity.',
        );
        this.elements.guide.state = {
          data: {
            title: 'Raise both your hands to add 30 seconds.',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        // await this.handTrackerService.waitUntilHandRaised('both-hands');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(5000);
      },
    ];
  }
  postLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Activity completed.');
        this.elements.guide.state = {
          data: {
            title: 'Activity completed.',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);

        this.ttsService.tts(`Coins collected: 1, time completed: 3 minutes.`);
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'outro',
            htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Moving Tones</h1>
            <h2 class="pt-7">Coins Collected: 1 (placeholder)</h2>
            <h2 class="pt-5">High Score:  1 Coins (placeholder)</h2>
            <h2 class="pt-5">Time Completed: 3:00 minutes (placeholder)</h2>
          <div>
          `,
            buttons: [
              {
                title: 'Back to Homepage',
                progressDurationMs: 10000,
              },
            ],
          },
        };

        await this.elements.sleep(12000);
        this.elements.banner.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };

        this.ttsService.tts('Well done. See you soon!');
        this.elements.guide.state = {
          data: {
            title: 'Well done. See you soon!',
            titleDuration: 2500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(4000);
        window.parent.postMessage(
          {
            type: 'end-game',
          },
          '*',
        );
      },
    ];
  }
}
