import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { game } from 'src/app/store/actions/game.actions';
import { ActivityStage } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { CalibrationService } from '../calibration/calibration.service';
import { ApiService } from '../checkin/api.service';
import { HandsService } from '../hands/hands.service';
import { PoseModelAdapter } from '../pose-model-adapter/pose-model-adapter.service';
import { TtsService } from '../tts/tts.service';
import { UiHelperService } from '../ui-helper/ui-helper.service';
import { GameService } from './game.service';

describe('GameService', () => {
  let service: GameService;
  const settings = { settings: environment.settings.sit_stand_achieve };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(GameService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check auth', () => {
    spyOn(window.parent, 'postMessage');

    service.checkAuth();

    expect(window.parent.postMessage).toHaveBeenCalled();
  });

  it('should set phaser dimensions', fakeAsync(() => {
    spyOn(GameService.prototype, 'updateDimensions');
    const canvas = document.createElement('canvas');
    expect(service.game).not.toBeDefined();

    service.setPhaserDimensions(canvas);
    tick(5);

    expect(service.game).toBeInstanceOf(Phaser.Game);
    expect(GameService.prototype.updateDimensions).toHaveBeenCalledWith(
      canvas.querySelector('canvas') as HTMLCanvasElement,
    );
    flush();
  }));

  it('should start pose detection', fakeAsync(() => {
    spyOn(PoseModelAdapter.prototype, 'start');
    const video = document.createElement('video');
    service.setPoseModel('mediapipe');
    service.startPoseDetection(video);
    tick(1000);

    expect(PoseModelAdapter.prototype.start).toHaveBeenCalledWith(video);
    flush();
  }));

  it('should start hand detection', fakeAsync(() => {
    spyOn(HandsService.prototype, 'start');
    const video = document.createElement('video');

    service.startHandDetection(video);
    tick(1000);

    expect(HandsService.prototype.start).toHaveBeenCalledWith(video);
    flush();
  }));

  it('should get activities', () => {
    const activities = service.getActivities();

    const hasMovingTones = environment.stageName !== 'stage' && environment.stageName !== 'prod';
    if (hasMovingTones) {
      expect(Object.keys(activities)).toContain('moving_tones');
      expect(Object.keys(activities).length).toEqual(4);
      return;
    }
    expect(Object.keys(activities)).not.toContain('moving_tones');
    expect(Object.keys(activities).length).toEqual(3);
  });

  it('should update calibration duration', () => {
    spyOn(Store.prototype, 'dispatch');

    jasmine.clock().install();
    const time = new Date(2022, 9, 23);
    service.calibrationStartTime = time;
    jasmine.clock().mockDate(time);
    jasmine.clock().tick(50_000);

    service.updateCalibrationDuration();

    expect(Store.prototype.dispatch).toHaveBeenCalledWith(
      game.setCalibrationDuration({ calibrationDuration: 50 }),
    );
  });

  it('should update video dimensions in x axis', () => {
    spyOn(UiHelperService.prototype, 'getBoundingBox').and.returnValue({
      topLeft: { x: 10, y: 0 },
      topRight: { x: 1210, y: 0 },
      bottomLeft: { x: 10, y: 700 },
      bottomRight: {
        x: 1210,
        y: 700,
      },
    });
    const video = document.createElement('video');

    service.updateDimensions(video);

    expect(video.style.marginLeft).toEqual('10px');
    expect(video.style.marginTop).toEqual('');
    expect(video.width).toEqual(1200);
    expect(video.height).toEqual(700);
  });

  it('should update video dimensions in y axis', () => {
    spyOn(UiHelperService.prototype, 'getBoundingBox').and.returnValue({
      topLeft: { x: 0, y: 10 },
      topRight: { x: 1210, y: 0 },
      bottomLeft: { x: 10, y: 700 },
      bottomRight: {
        x: 1210,
        y: 700,
      },
    });
    const video = document.createElement('video');

    service.updateDimensions(video);

    expect(video.style.marginLeft).toEqual('');
    expect(video.style.marginTop).toEqual('10px');
    expect(video.width).toEqual(1210);
    expect(video.height).toEqual(690);
  });

  it('should give first game of the day with default settings', (done) => {
    spyOn(ApiService.prototype, 'getLastGame').and.returnValue(Promise.resolve([]));
    spyOn(ApiService.prototype, 'getGameSettings').and.returnValue(Promise.resolve(null));

    service.findNextGame().then((game) => {
      expect(game).toEqual({
        name: environment.order[0],
        settings: environment.settings[environment.order[0]],
      });
      done();
    });
  });

  it('should give first game of the day with game settings', (done) => {
    spyOn(ApiService.prototype, 'getLastGame').and.returnValue(Promise.resolve([]));
    spyOn(ApiService.prototype, 'getGameSettings').and.returnValue(Promise.resolve(settings));

    service.findNextGame().then((game) => {
      expect(game).toEqual({
        name: environment.order[0],
        settings: environment.settings[environment.order[0]],
      });
      done();
    });
  });

  it('should give current game if incomplete', (done) => {
    spyOn(ApiService.prototype, 'getLastGame').and.returnValue(
      Promise.resolve([
        {
          game: 'beat_boxer',
        },
      ]),
    );
    spyOn(ApiService.prototype, 'getGameSettings').and.returnValue(Promise.resolve());
    spyOn(ApiService.prototype, 'getLastPlayedGame').and.returnValue(
      Promise.resolve([
        {
          game: 'beat_boxer',
        },
      ]),
    );

    service.findNextGame().then((game) => {
      expect(game?.name).toEqual(environment.order[1]);
      expect(game?.settings).toEqual(environment.settings['beat_boxer']);
      done();
    });
  });

  it('should give current game along with the settings', (done) => {
    spyOn(ApiService.prototype, 'getLastGame').and.returnValue(
      Promise.resolve([
        {
          game: 'beat_boxer',
        },
      ]),
    );
    spyOn(ApiService.prototype, 'getGameSettings').and.returnValue(Promise.resolve(settings));
    spyOn(ApiService.prototype, 'getLastPlayedGame').and.returnValue(
      Promise.resolve([
        {
          game: 'beat_boxer',
        },
      ]),
    );

    service.findNextGame().then((game) => {
      expect(game?.name).toEqual(environment.order[1]);
      expect(game?.settings).toEqual(settings.settings as any);
      done();
    });
  });

  it('should give next game if previous game is completed', (done) => {
    spyOn(ApiService.prototype, 'getLastGame').and.returnValue(
      Promise.resolve([
        {
          game: 'beat_boxer',
        },
      ]),
    );
    spyOn(ApiService.prototype, 'getGameSettings').and.returnValue(Promise.resolve(settings));
    spyOn(ApiService.prototype, 'getLastPlayedGame').and.returnValue(
      Promise.resolve([
        {
          game: 'beat_boxer',
          endedAt: '1668509671966',
        },
      ]),
    );

    service.findNextGame().then((game) => {
      expect(game?.name).toEqual(environment.order[2]);
      done();
    });
  });

  it('should give all game stages', (done) => {
    spyOn(ApiService.prototype, 'getOnboardingStatus').and.returnValue(Promise.resolve([]));
    const allStages: Array<ActivityStage> = ['welcome', 'tutorial', 'preLoop', 'loop', 'postLoop'];

    service.getRemainingStages(environment.order[0]).then((stages) => {
      expect(stages).toEqual(allStages);
      done();
    });
  });

  it('should give all game stages if api data is empty', (done) => {
    spyOn(ApiService.prototype, 'getOnboardingStatus').and.returnValue(
      Promise.resolve([
        {
          onboardingStatus: {},
        },
      ]),
    );
    const allStages: Array<ActivityStage> = ['welcome', 'tutorial', 'preLoop', 'loop', 'postLoop'];

    service.getRemainingStages(environment.order[0]).then((stages) => {
      expect(stages).toEqual(allStages);
      done();
    });
  });

  it('should give all game stages except tutorial', (done) => {
    spyOn(ApiService.prototype, 'getOnboardingStatus').and.returnValue(
      Promise.resolve([
        {
          onboardingStatus: {
            [environment.order[0]]: true,
          },
        },
      ]),
    );
    const allStages: Array<ActivityStage> = ['welcome', 'preLoop', 'loop', 'postLoop'];

    service.getRemainingStages(environment.order[0]).then((stages) => {
      expect(stages).toEqual(allStages);
      done();
    });
  });

  it('should start calibration', fakeAsync(() => {
    spyOn(TtsService.prototype, 'tts');
    spyOn(CalibrationService.prototype, 'startCalibrationScene');
    spyOn(service, 'setupSubscriptions');

    service.startCalibration();
    expect(CalibrationService.prototype.startCalibrationScene).toHaveBeenCalledWith(
      service.game as Phaser.Game,
    );

    expect(service.setupSubscriptions).not.toHaveBeenCalled();
    expect(service.calibrationStartTime).not.toBeDefined();
    tick(5000);

    expect(service.setupSubscriptions).toHaveBeenCalled();
    expect(service.calibrationStartTime).toBeDefined();
    flush();
  }));

  it('should sleep for certain time', fakeAsync(() => {
    let x = 1;

    service.sleep(2000).then(() => (x = 2));
    tick(1000);
    expect(x).toEqual(1);

    tick(1000);
    expect(x).toEqual(2);
    flush();
  }));
});
