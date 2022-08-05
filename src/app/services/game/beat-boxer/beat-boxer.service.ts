import { Injectable } from '@angular/core';
import { ElementsService } from '../../elements/elements.service';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { TtsService } from '../../tts/tts.service';
import { CheckinService } from '../../checkin/checkin.service';
import { Store } from '@ngrx/store';
import {
  BagPosition,
  BagType,
  GameState,
  Genre,
  ObstacleType,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { game } from 'src/app/store/actions/game.actions';
import { SoundsService } from '../../sounds/sounds.service';
import { CalibrationService } from '../../calibration/calibration.service';
import { GameStateService } from '../../game-state/game-state.service';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerService {
  private genre: Genre;
  private globalReCalibrationCount: number;
  private bagPositions: BagPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  private bagTypes: BagType[] = ['heavy-red', 'speed-red', 'heavy-blue', 'speed-blue'];
  private obstacleTypes: ObstacleType[] = ['obstacle-top', 'obstacle-bottom'];

  constructor(
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
    private elements: ElementsService,
    private handTrackerService: HandTrackerService,
    private ttsService: TtsService,
    private checkinService: CheckinService,
    private soundsService: SoundsService,
    private calibrationService: CalibrationService,
    private gameStateService: GameStateService,
    private beatBoxerScene: BeatBoxerScene,
  ) {
    this.handTrackerService.enable();
    this.store
      .select((state) => state.game)
      .subscribe((game) => {
        if (game.id) {
          //Update the game state whenever redux state changes
          const { id, ...gameState } = game;
          this.gameStateService.updateGame(id, gameState);
        }
      });
    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.soundsService.loadMusicFiles(this.genre);
        }
      });
    calibrationService.reCalibrationCount.subscribe((count) => {
      this.globalReCalibrationCount = count;
    });
    this.beatBoxerScene.enable();
    this.beatBoxerScene.enableLeftHand();
    this.beatBoxerScene.enableRightHand();
    this.beatBoxerScene.enableCollisionDetection();
  }

  welcome() {
    return [
      async (reCalibrationCount: number) => {
        this.beatBoxerScene.scene.start('beatBoxer');
        this.ttsService.tts("Raise one of your hands when you're ready to begin.");
        this.elements.guide.state = {
          data: {
            title: "Raise your hand when you're ready to start.",
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('left-hand');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        // Todo: remove this
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Some instructions before we start');
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['INSTRUCTIONS'],
          },
        };
        await this.elements.sleep(2500);
        this.elements.overlay.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            ...this.elements.overlay.state.data,
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
        this.soundsService.playActivityInstructionSound(this.genre);
        this.ttsService.tts("First, let's begin with a guide to beat boxer");
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['A Guide to Beat Boxer'],
          },
        };
        await this.elements.sleep(4000);
        this.ttsService.tts('Welcome to beat boxer');
        this.elements.guide.state = {
          data: {
            title: 'Welcome to Beat Boxer.',
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Punch when you see any object on the screen.');
        this.elements.guide.state = {
          data: {
            title: 'Punch when you see an object on screen.',
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(1200);
        this.beatBoxerScene.showBag('top-left', 'speed-blue');
        const result = await this.beatBoxerScene.waitForCollisionOrTimeout();
        this.ttsService.tts(
          'Did you hear that? You just created music by punching the punching bag.',
        );
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Did you hear that?',
            description: 'You just created music by punching the punching bag!',
            src: 'assets/videos/sit-to-stand/odd_num.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Remember to use your right hand to punch the red bags.');
        this.elements.guide.state = {
          data: {
            title: 'Use your right hand to punch the red bag.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        this.ttsService.tts('Ready?');
        this.elements.score.state = {
          data: {
            label: '',
            value: '0',
            goal: '4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        let successfulReps = 0;
        const repsToComplete = 4;
        for (let i = 0; i < 4; i++) {
          // Todo: change the * 2 to randomPosition length
          const randomPosition: BagPosition = this.bagPositions[
            Math.floor(Math.random() * 2)
          ] as BagPosition;
          const randomRedBag: BagType = this.bagTypes[Math.floor(Math.random() * 2)] as BagType;

          this.beatBoxerScene.showBag(randomPosition, randomRedBag);
          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout();
          if (rep.result === 'success') {
            successfulReps += 1;
            this.elements.score.state = {
              data: {
                label: '',
                value: successfulReps,
                goal: repsToComplete,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          }
        }
        await this.elements.sleep(2000);
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Good job.');
        this.elements.guide.state = {
          data: {
            title: 'Good job!',
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Remember to use your left hand when you see a blue bag.');
        this.elements.guide.state = {
          data: {
            title: 'Use your left hand to punch the blue bag.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        let successfulReps = 0;
        const repsToComplete = 4;
        this.elements.score.state = {
          data: {
            label: '',
            value: successfulReps,
            goal: repsToComplete,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        for (let i = 0; i < 4; i++) {
          // Todo: change the * 2 to randomPosition length
          const randomPosition: BagPosition = this.bagPositions[
            Math.floor(Math.random() * 2)
          ] as BagPosition;
          const randomBlueBag: BagType = this.bagTypes[
            Math.floor(Math.random() * 2) + 2
          ] as BagType;

          this.beatBoxerScene.showBag(randomPosition, randomBlueBag);
          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout();
          if (rep.result === 'success') {
            successfulReps += 1;
            this.elements.score.state = {
              data: {
                label: '',
                value: successfulReps,
                goal: repsToComplete,
              },
              attributes: {
                visibility: 'visible',
                reCalibrationCount,
              },
            };
          }
        }
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.ttsService.tts('Well done.');
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
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('And finally, avoid punching the caution signs.');
        this.elements.guide.state = {
          data: {
            title: 'And finally, avoid punching the caution signs.',
            titleDuration: 3000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
        const randomPosition: BagPosition = this.bagPositions[
          Math.floor(Math.random() * 2)
        ] as BagPosition;
        const randomObstacle: ObstacleType = this.obstacleTypes[
          Math.floor(Math.random() * 2)
        ] as ObstacleType;

        this.beatBoxerScene.showBag('top-left', 'speed-blue');
        this.beatBoxerScene.showObstacle(randomPosition, randomObstacle);
        const rep = await this.beatBoxerScene.waitForCollisionOrTimeout();
        if (rep.result === 'failure') {
          this.ttsService.tts("I knew you couldn't resist it.");
          this.elements.guide.state = {
            data: {
              title: "I knew you couldn't resist it.",
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(5000);
        } else {
          this.ttsService.tts('Good job!');
          this.elements.guide.state = {
            data: {
              title: 'Good job!',
            },
            attributes: {
              visibility: 'visible',
              reCalibrationCount,
            },
          };
          await this.elements.sleep(4000);
        }
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts(
          "Let's try a few movements in a sequence. And try following a rhythm like this while playing the notes this time.",
        );
        this.elements.guide.state = {
          data: {
            title: "Let's try a few moves in a sequence now.",
            titleDuration: 2000,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(1000);
        this.elements.video.state = {
          data: {
            type: 'video',
            title: 'Be the musician!',
            description: 'Try following a rhythm when you play the notes.',
            src: 'assets/videos/sit-to-stand/odd_num.mp4',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(8000);
        this.ttsService.tts('You have the power to create the music.');
        this.elements.video.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        await this.elements.sleep(4000);
      },
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['3', '2', '1', 'Go!'],
            titleDuration: 1200,
            tts: true,
          },
        };
        await this.elements.sleep(8000);
        // Todo: 5 reps
      },
      async (reCalibrationCount: number) => {
        for (let i = 0; i < 6; i++) {
          if (reCalibrationCount !== this.globalReCalibrationCount) {
            throw new Error('reCalibrationCount changed');
          }
          // Todo: change the * 2 to randomPosition length
          const randomPosition: BagPosition = this.bagPositions[
            Math.floor(Math.random() * 2)
          ] as BagPosition;
          const randomBag: BagType = this.bagTypes[
            Math.floor(Math.random() * this.bagTypes.length)
          ] as BagType;
          const shouldShowObstacle = Math.random() > 0.5;
          const obstacleType = this.obstacleTypes[
            Math.floor(Math.random() * this.obstacleTypes.length)
          ] as ObstacleType;
          // show obstacle where the bag doesn't show up
          const obstaclePosition = this.bagPositions.filter((pos) => {
            return pos !== randomPosition;
          })[Math.floor(Math.random() * (this.bagPositions.length - 1))];

          this.beatBoxerScene.showBag(randomPosition, randomBag);
          if (shouldShowObstacle) {
            this.beatBoxerScene.showObstacle(obstaclePosition, obstacleType);
          }
          const rep = await this.beatBoxerScene.waitForCollisionOrTimeout();
        }
        // Todo: confetti animation
        await this.elements.sleep(3000);
        this.ttsService.tts("Great job! looks like you're getting the hang of it.");
        this.elements.guide.state = {
          data: {
            title: "Great job! looks like you're getting the hang of it.",
            titleDuration: 3500,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(3000);
      },
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Guide complete.');
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Guide Completed'],
            titleDuration: 2000,
          },
        };
        await this.elements.sleep(3000);
        this.soundsService.pauseActivityInstructionSound(this.genre);
        await this.checkinService.updateOnboardingStatus({
          beat_boxer: true,
        });
      },
    ];
  }

  preLoop() {
    return [
      async (reCalibrationCount: number) => {
        this.ttsService.tts('Next Activity. Beat Boxer.');
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Next Activity</h2>
              <h1 class="pt-6 display-4">Beat Boxer</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="py-2">Endurance and Coordination</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Beat Boxer',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
        this.ttsService.tts("Raise one of your hands when you're ready to begin.");
        this.elements.guide.state = {
          data: {
            title: "Raise your hand when you're ready to start.",
            showIndefinitely: true,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.handTrackerService.waitUntilHandRaised('left-hand');
        this.soundsService.playCalibrationSound('success');
        this.elements.guide.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        // Todo: remove this
        await this.elements.sleep(5000);
        this.ttsService.tts('Get ready to start.');
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['Get Ready to Start!'],
            titleDuration: 2000,
          },
        };
        await this.elements.sleep(3000);
      },
    ];
  }

  loop() {
    return [
      async (reCalibrationCount: number) => {
        this.elements.ribbon.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            titles: ['3', '2', '1', 'Go!'],
            titleDuration: 1200,
            tts: true,
          },
        };
        await this.elements.sleep(7000);
        this.elements.score.state = {
          data: {
            label: 'Punches',
            value: '0',
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        const updateElapsedTime = (elapsedTime: number) => {
          this.store.dispatch(game.setTotalElapsedTime({ totalDuration: elapsedTime }));
        };
        this.elements.timer.state = {
          data: {
            mode: 'start',
            duration: 60 * 60 * 1000,
            onPause: updateElapsedTime,
            onComplete: updateElapsedTime,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
        };
        await this.elements.sleep(5000);
      },
      async (reCalibrationCount: number) => {
        this.soundsService.playMusic(this.genre, 'backtrack');
        //Todo: reps
        //Todo: confetti animation
      },
    ];
  }

  postLoop() {
    return [
      // Todo: replace hardcoded values
      async (reCalibrationCount: number) => {
        this.gameStateService.postLoopHook();
        this.soundsService.stopGenreSound();
        this.elements.score.attributes = {
          visibility: 'hidden',
          reCalibrationCount,
        };
        this.elements.timer.state = {
          data: {
            mode: 'stop',
          },
          attributes: {
            visibility: 'hidden',
            reCalibrationCount,
          },
        };
        this.store.dispatch(game.gameCompleted());
        let totalDuration: {
          minutes: string;
          seconds: string;
        };
        //Todo: Add TTS for the banner text
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'outro',
            htmlStr: `
          <div class="pl-10 text-start px-14" style="padding-left: 20px;">
            <h1 class="pt-8 display-3">Beat Boxer</h1>
            <h2 class="pt-7">Time: 1:24 minutes (Hardcoded)</h2>
            <h2 class="pt-5">Fastest Time: 1:24 minutes (Hardcoded)</h2>
            <h2 class="pt-5">Reps Completed: 10 (Hardcoded)</h2>
          <div>
          `,
            buttons: [
              {
                title: 'Next Activity',
                progressDurationMs: 15000,
              },
            ],
          },
        };
        await this.elements.sleep(17000);
        this.elements.banner.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount,
          },
          data: {
            type: 'intro',
            htmlStr: `
            <div class="w-full h-full d-flex flex-column justify-content-center align-items-center">
              <h1 class="pt-2">Next Activity</h2>
              <h1 class="pt-6 display-4">Sound Slice</h1>
              <h1 class="pt-8" style="font-weight: 200">Area of Focus</h2>
              <h1 class="py-2">Range of Motion and Balance</h2>
            </div>
            `,
            buttons: [
              {
                title: 'Starting Sound Slice',
                progressDurationMs: 5000,
              },
            ],
          },
        };
        await this.elements.sleep(7000);
      },
    ];
  }
}
