import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { Howl } from 'howler';
import { SitToStandScene } from 'src/app/scenes/sit-to-stand/sit-to-stand.scene';
import { environment } from 'src/environments/environment';
import { ApiService } from '../../checkin/api.service';
import { SitToStandService as Sit2StandService } from '../../classifiers/sit-to-stand/sit-to-stand.service';
import { ElementsService } from '../../elements/elements.service';
import { audioSprites } from '../../sounds/audio-sprites';
import { TtsService } from '../../tts/tts.service';
import { SitToStandService } from './sit-to-stand.service';

describe('SitToStandService', () => {
  let service: SitToStandService;
  let apiService: jasmine.SpyObj<ApiService>;
  let elementsSpy: jasmine.SpyObj<ElementsService>;
  let ttsServiceSpy: jasmine.SpyObj<TtsService>;

  beforeEach(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'updateOnboardingStatus',
      'updateGameSettings',
    ]);
    elementsSpy = jasmine.createSpyObj('ElementsService', ['sleep', 'guide', 'prompt', 'timeout']);
    ttsServiceSpy = jasmine.createSpyObj('TtsService', ['tts']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideMockStore({}),
        { provide: ApiService, useValue: apiService },
        { provide: ElementsService, useValue: elementsSpy },
        // { provide: TtsService, useValue: ttsServiceSpy },
      ],
    });
    service = TestBed.inject(SitToStandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  xit('should show tutorial if achievement ratio is below 25%', fakeAsync(() => {
    spyOn(service, 'stopGame');
    service['successfulReps'] = 2;
    service['totalReps'] = 10;
    service['currentLevel'] = 'level1';

    service.postLoop()[0](0);
    tick();

    expect(apiService.updateOnboardingStatus).toHaveBeenCalledWith({
      sit_stand_achieve: false,
    });
  }));

  xit('should not show tutorial if achievement ratio is above 25%', fakeAsync(() => {
    spyOn(service, 'stopGame');
    service['successfulReps'] = 3;
    service['totalReps'] = 10;
    service['currentLevel'] = 'level1';

    service.postLoop()[0](0);
    tick();

    expect(apiService.updateOnboardingStatus).not.toHaveBeenCalled();
  }));

  it('should reset all variables', () => {
    service['isServiceSetup'] = true;
    service['globalReCalibrationCount'] = 1;
    service['qaGameSettings'] = {};
    service['gameSettings'] = {} as any;
    service['currentLevel'] = 'level1';
    service['streak'] = 1;
    service['levelUpStreak'] = 1;
    service['shouldLevelUp'] = true;
    service['config'] = { minCorrectReps: 1, speed: 1 };
    service['successfulReps'] = 1;
    service['failedReps'] = 1;
    service['totalReps'] = 1;
    service['totalDuration'] = 1;
    service['shouldReplay'] = true;
    service['gameStartTime'] = 1;
    service['firstPromptTime'] = 1;
    service['loopStartTime'] = 1;
    service['comboStreak'] = 1;
    service['health'] = 1;
    service['score'] = 1;
    service['analytics'] = [];
    service['highScore'] = 1;

    service.resetVariables();
    expect(service['isServiceSetup']).toBeFalsy();
    expect(service['genre']).toEqual('jazz');
    expect(service['globalReCalibrationCount']).toEqual(0);
    expect(service['qaGameSettings']).toBeUndefined();
    expect(service['gameSettings']).toEqual(environment.settings['sit_stand_achieve']);
    expect(service['currentLevel']).toEqual(environment.settings['sit_stand_achieve'].currentLevel);
    expect(service['streak']).toEqual(0);
    expect(service['levelUpStreak']).toEqual(10);
    expect(service['shouldLevelUp']).toBeFalsy();
    expect(service['config']).toEqual({
      minCorrectReps:
        service['gameSettings'].levels[service['currentLevel']].configuration.minCorrectReps,
      speed: service['gameSettings'].levels[service['currentLevel']].configuration.speed,
    });
    expect(service['successfulReps']).toEqual(0);
    expect(service['failedReps']).toEqual(0);
    expect(service['totalReps']).toEqual(0);
    expect(service['totalDuration']).toEqual(0);
    expect(service['shouldReplay']).toBeFalsy();
    expect(service['gameStartTime']).toBeNull();
    expect(service['firstPromptTime']).toBeNull();
    expect(service['loopStartTime']).toBeNull();
    expect(service['comboStreak']).toEqual(0);
    expect(service['health']).toEqual(3);
    expect(service['score']).toEqual(0);
    expect(service['analytics']).toEqual([]);
    expect(service['highScore']).toEqual(0);
  });

  it('should show prompt and return analytics object', async () => {
    const promptNum = 1;
    const promptId = 'prompt1';
    const analytics: any[] = [];
    const reCalibrationCount = 0;
    const stringExpression = '1+0';
    const classical = new Howl({
      src: [],
      sprite: audioSprites.classicalSprite[Math.floor(Math.random() * 2)],
      html5: true,
      onload: () => {},
      onloaderror: () => {},
    });

    const promptClass = 'stand';
    const sit2StandSceneSpy = spyOn(SitToStandScene.prototype, 'getBacktrack').and.returnValue(
      classical,
    );
    const ttsSpy = spyOn(TtsService.prototype, 'tts');
    const res: any = {
      currentClass: 'stand',
      result: 'success',
    };
    const analyticsObj: any = {
      prompt: {
        id: promptId,
        type: promptClass,
        timestamp: jasmine.any(Number),
        data: {
          number: promptNum,
          ...(stringExpression ? { stringExpression } : {}),
        },
      },
      reaction: {
        type: res.currentClass,
        timestamp: jasmine.any(Number),
        startTime: jasmine.any(Number),
        completionTimeInMs: jasmine.any(Number),
      },
      result: {
        type: res.result,
        timestamp: jasmine.any(Number),
        score: res.result === 'success' ? 1 : 0,
        coin: 0,
      },
    };
    const waitForClassChangeOrTimeOutSpy = spyOn(
      Sit2StandService.prototype,
      'waitForClassChangeOrTimeOut',
    ).and.resolveTo(res);

    const result = await service.showPrompt(
      promptNum,
      promptId,
      analytics,
      reCalibrationCount,
      stringExpression,
    );

    expect(service['totalReps']).toBe(1);
    expect(sit2StandSceneSpy).toHaveBeenCalledWith(service['genre']);
    expect(ttsSpy).toHaveBeenCalledWith('1 plus 0', classical);
    expect(waitForClassChangeOrTimeOutSpy).toHaveBeenCalledWith(
      promptClass,
      service['config'].speed,
    );
    expect(result).toEqual({
      res,
      analyticsObj,
    });
  });
});
