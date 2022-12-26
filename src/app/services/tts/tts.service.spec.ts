import { fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { Howl } from 'howler';

import { TtsService } from './tts.service';

describe('TtsService', () => {
  let service: TtsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TtsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should play tts', () => {
    expect(service['sound']).not.toEqual(jasmine.anything());

    service.tts('test');

    expect(service['sound']).toBeInstanceOf(Howl);
  });

  it('should not play tts if already playing', () => {
    expect(service['sound']).not.toEqual(jasmine.anything());
    expect(service['queue'].length).toEqual(0);

    service.tts('test');
    service.tts('test');

    expect(service['queue'].length).toEqual(1);
  });

  it('should stop tts', () => {
    spyOn(Howl.prototype, 'stop');

    service.tts('test');
    service.stopTts();

    expect(Howl.prototype.stop).toHaveBeenCalled();
  });

  it('should preload tts', () => {
    spyOn<any>(service, 'cacheTts');
    expect(service['isFilesLoadedCountZero']).toEqual(0);

    service.preLoadTts('sit_stand_achieve');
    expect(service['isFilesLoadedCountZero']).toEqual(16);
  });

  it('should cache tts', () => {
    expect(service['cacheStore']).toEqual({});

    service['cacheTts']('sit_stand_achieve');
    expect(Object.keys(service['cacheStore']).length).toEqual(1);

    service['cacheTts']('sit_stand_achieve');
    expect(Object.keys(service['cacheStore']).length).toEqual(1);
  });

  it('should reset cache', () => {
    expect(service['cacheStore']).toEqual({});

    service['cacheTts']('sit_stand_achieve');
    expect(Object.keys(service['cacheStore']).length).toEqual(1);

    service['resetCache']();
    expect(Object.keys(service['cacheStore']).length).toEqual(0);
  });
});
