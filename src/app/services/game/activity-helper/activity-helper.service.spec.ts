import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of, Subject } from 'rxjs';
import { HandTrackerStatus } from 'src/app/types/pointmotion';
import { HandTrackerService } from '../../classifiers/hand-tracker/hand-tracker.service';
import { ElementsService } from '../../elements/elements.service';

import { ActivityHelperService } from './activity-helper.service';

describe('ActivityHelperService', () => {
  let service: ActivityHelperService;
  let elementsSpy: jasmine.SpyObj<ElementsService>;
  const sidewaysGestureResult = new Subject<HandTrackerStatus>();

  beforeEach(() => {
    elementsSpy = jasmine.createSpyObj('elements', ['sleep', 'guide']);
    elementsSpy.guide = jasmine.createSpyObj('GuideElement', ['state']);
    elementsSpy.guide.state = {
      attributes: { visibility: 'hidden', reCalibrationCount: 1 },
      data: { title: 'dummy title', showIndefinitely: false },
    };
    elementsSpy.gameMenu = jasmine.createSpyObj('GameMenuElement', ['state']);
    elementsSpy.gameMenu.state = {
      attributes: { visibility: 'hidden', reCalibrationCount: 1 },
      data: { gesture: undefined, onExit: () => {} },
    };
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        provideMockStore({}),
        { provide: ElementsService, useValue: elementsSpy },
        {
          provide: HandTrackerService,
          useValue: { sidewaysGestureResult },
        },
      ],
    });
    service = TestBed.inject(ActivityHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should exit the game', fakeAsync(() => {
    spyOn(window.parent, 'postMessage');
    service.exitOrReplay(1);
    tick(600);
    expect(elementsSpy.guide.state.attributes.visibility).toEqual('visible');
    expect(elementsSpy.gameMenu.state.attributes.visibility).toEqual('visible');
    tick(200);
    elementsSpy.gameMenu.state.data.onExit?.();
    tick(0);
    expect(window.parent.postMessage).toHaveBeenCalledWith(
      { type: 'end-game' },
      '*' as WindowPostMessageOptions,
    );
    expect(elementsSpy.guide.state.attributes.visibility).toEqual('visible');
    expect(elementsSpy.gameMenu.state.attributes.visibility).toEqual('visible');
    flush();
  }));

  it('should replay the game', fakeAsync(() => {
    spyOn(window.parent, 'postMessage');
    service.exitOrReplay(1);
    tick(600);
    expect(elementsSpy.guide.state.attributes.visibility).toEqual('visible');
    expect(elementsSpy.gameMenu.state.attributes.visibility).toEqual('visible');
    tick(200);
    elementsSpy.gameMenu.state.data.onReplay?.();
    tick(0);
    expect(window.parent.postMessage).not.toHaveBeenCalled();
    flush();
  }));
});
