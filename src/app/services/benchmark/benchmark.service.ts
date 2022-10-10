import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { SoundExplorerScene } from 'src/app/scenes/sound-explorer.scene';
import { game } from 'src/app/store/actions/game.actions';
import { GameState, Genre, PreferenceState } from 'src/app/types/pointmotion';
import { CheckinService } from '../checkin/checkin.service';
import { HandTrackerService } from '../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../elements/elements.service';
import { GameStateService } from '../game-state/game-state.service';
import { BeatBoxerService } from '../game/beat-boxer/beat-boxer.service';
import { SitToStandService } from '../game/sit-to-stand/sit-to-stand.service';
import { SoundExplorerService } from '../game/sound-explorer/sound-explorer.service';
import { SoundsService } from '../sounds/sounds.service';
import { TtsService } from '../tts/tts.service';

@Injectable({
  providedIn: 'root',
})
export class BenchmarkService {
  public video: any;
  private gameId: string;
  private originalGameId: string;
  private genre: Genre;
  private pointsGained = 0;
  private currentScore = 0;

  constructor(
    private elements: ElementsService,
    private sitToStandService: SitToStandService,
    private sit2StandScene: SitToStandScene,
    private beatBoxerService: BeatBoxerService,
    private beatBoxerScene: BeatBoxerScene,
    private soundExplorerService: SoundExplorerService,
    private soundExplorerScene: SoundExplorerScene,
    private checkinService: CheckinService,
    private ttsService: TtsService,
    private handTrackerService: HandTrackerService,
    private soundsService: SoundsService,
    private gameStateService: GameStateService,
    private store: Store<{
      game: GameState;
      preference: PreferenceState;
    }>,
  ) {}

  private async showPrompt(
    gameName: string,
    promptDetails: any,
    promptId: string,
    analytics: any[],
  ) {
    if (!promptDetails) return;

    let analyticsObj: any;
    switch (gameName) {
      case 'sit_stand_achieve':
        const sit2StandResult = await this.sitToStandService.showPrompt(
          promptDetails.number,
          promptId,
          analytics,
          1,
        );
        if (sit2StandResult.res.result === 'success')
          this.sit2StandScene.playMusic(this.genre, 'trigger');
        else this.soundsService.playCalibrationSound('error');
        this.elements.prompt.state = {
          data: {
            repStatus: sit2StandResult.res.result,
          },
          attributes: {
            visibility: 'visible',
            reCalibrationCount: 1,
          },
        };
        analyticsObj = sit2StandResult.analyticsObj;
        break;
      case 'beat_boxer':
        const beatBoxerResult = await this.beatBoxerService.showPrompt(promptDetails, promptId, 1);
        analyticsObj = beatBoxerResult.analyticsObj;
        break;
      default:
        const soundExplorerResult = await this.soundExplorerService.showPrompt(
          promptDetails,
          promptId,
        );
        analyticsObj = soundExplorerResult.analyticsObj;
        break;
    }
    this.store.dispatch(game.pushAnalytics({ analytics: [analyticsObj] }));
    return analyticsObj;
  }

  setVideo(video: any) {
    this.video = video;
  }

  async loadRawVideo(url: string): Promise<void> {
    return new Promise((resolve) => {
      this.video.src = url + '#t=5';
      this.video.muted = true;
      this.video.oncanplaythrough = () => {
        resolve();
      };
    });
  }

  private async loadBenchmark(nextGame: string) {
    this.elements.banner.state = {
      attributes: {
        visibility: 'visible',
        reCalibrationCount: 1,
      },
      data: {
        type: 'loader',
        htmlStr: `
    <div class="w-full h-full d-flex flex-column justify-content-center align-items-center px-10">
      <h1 class="pt-4 display-3">Loading Game...</h1>
      <h3 class="pt-8 pb-4">Please wait while we download the audio and video files for the game. It should take less than a minute.</h3>
    </div>
    `,
        buttons: [
          {
            title: '',
            infiniteProgress: true,
          },
        ],
      },
    };

    this.store
      .select((state) => state.preference)
      .subscribe((preference) => {
        if (preference.genre && this.genre !== preference.genre) {
          this.genre = preference.genre;
          this.soundsService.loadMusicFiles(this.genre);
        }
      });

    if (nextGame === 'sit_stand_achieve') {
      await this.sitToStandService.setup();
      this.sit2StandScene.playMusic(this.genre, 'backtrack');
    } else if (nextGame === 'beat_boxer') {
      this.elements.score.state = {
        data: {
          label: 'Punches',
          value: '0',
        },
        attributes: {
          visibility: 'visible',
          reCalibrationCount: 1,
        },
      };
      await this.beatBoxerService.setup();
      this.beatBoxerScene.enableMusic();
    } else if (nextGame === 'sound_explorer') {
      this.soundExplorerScene.score.next(this.currentScore);
      this.soundExplorerScene.score.subscribe((score) => {
        this.elements.score.state = {
          attributes: {
            visibility: 'visible',
            reCalibrationCount: 1,
          },
          data: {
            label: 'Score',
            value: score,
          },
        };
        this.pointsGained = score - this.currentScore;
        this.currentScore = score;
        this.store.dispatch(game.setScore({ score }));
      });
      await this.soundExplorerService.setup();
      this.soundExplorerScene.enableMusic();
    }

    this.elements.banner.state = {
      data: {},
      attributes: {
        visibility: 'hidden',
        reCalibrationCount: 1,
      },
    };
    await this.elements.sleep(1000);

    this.elements.ribbon.state = {
      data: {
        titles: ['Benchmarking Started'],
      },
      attributes: {
        visibility: 'visible',
        reCalibrationCount: 1,
      },
    };

    await this.elements.sleep(1000);
    this.video.play();
    await this.elements.sleep(1000);

    const response = await this.gameStateService.newGame(nextGame).catch((err: any) => {
      console.log(err);
    });
    if (response.insert_game_one) {
      this.gameId = response.insert_game_one.id;
      this.store.dispatch(game.newGame(response.insert_game_one));
    }
  }

  private downloadReport(report: Blob) {
    if (!report) return;
    const url = window.URL.createObjectURL(report);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'report.xlsx');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * @description - This method is used to start the benchmarking process.
   *
   * @param {string} benchmarkId - benchmark config id
   *
   * @returns {Promise<{ status: 'success' | 'failure'; message: string }>} - 'success' or 'failure'
   */
  async benchmark(
    benchmarkId: string,
  ): Promise<{ status: 'success' | 'failure'; message: string }> {
    const config = await this.checkinService.getBenchmarkConfig(benchmarkId);
    if (!config) return { status: 'failure', message: 'Benchmark config not found' };

    this.originalGameId = config.originalGameId;

    const nextGame = await this.checkinService.getBenchmarkGame(this.originalGameId);

    if (!nextGame.analytics || !nextGame.analytics.length)
      return { status: 'failure', message: 'No analytics found' };

    await this.loadBenchmark(nextGame.game);

    const { loopStartTime, gameStartTime, firstPromptTime } = nextGame.analytics[0].prompt.data;
    if (!loopStartTime || !gameStartTime || !firstPromptTime)
      return { status: 'failure', message: 'Game start time not set' };

    const preGameWaitTime = loopStartTime - gameStartTime;
    await this.elements.sleep(preGameWaitTime);

    this.ttsService.tts("Raise one of your hands when you're ready to start.");
    this.elements.guide.state = {
      data: {
        title: "Raise your hand when you're ready to start.",
        showIndefinitely: true,
      },
      attributes: {
        visibility: 'visible',
        reCalibrationCount: 1,
      },
    };
    await this.handTrackerService.waitUntilHandRaised('any-hand');
    this.soundsService.playCalibrationSound('success');

    this.elements.guide.attributes = {
      visibility: 'hidden',
    };

    let nextPromptTime = nextGame.analytics[1].prompt.timestamp - firstPromptTime;

    await this.elements.sleep(nextPromptTime);

    const analytics: any[] = [];

    let analyticsObj = await this.showPrompt(
      nextGame.game,
      nextGame.analytics[1].prompt.data,
      nextGame.analytics[1].prompt.id,
      nextGame.analytics.slice(2),
    );

    analytics.push(analyticsObj);

    for (let idx = 2; idx < nextGame.analytics.length; idx++) {
      nextPromptTime =
        nextGame.analytics[idx].prompt.timestamp - nextGame.analytics[idx - 1].result.timestamp;

      await this.elements.sleep(nextPromptTime);

      analyticsObj = await this.showPrompt(
        nextGame.game,
        nextGame.analytics[idx].prompt.data,
        nextGame.analytics[idx].prompt.id,
        nextGame.analytics.slice(0, idx),
      );

      analytics.push(analyticsObj);
    }

    const result = await this.checkinService.saveAutoBenchmark(
      this.gameId,
      this.originalGameId,
      analytics,
    );
    console.log(result);

    await this.elements.sleep(1000);
    this.elements.prompt.attributes = {
      visibility: 'hidden',
      reCalibrationCount: 1,
    };

    this.elements.ribbon.state = {
      data: {
        titles: ['Benchmarking Completed'],
      },
      attributes: {
        visibility: 'visible',
        reCalibrationCount: 1,
      },
    };
    this.store.dispatch(game.gameCompleted());

    const report: any = await this.checkinService.generateBenchmarkReport(benchmarkId, this.gameId);
    this.downloadReport(report);

    return { status: 'success', message: 'Benchmarking completed' };
  }
}
