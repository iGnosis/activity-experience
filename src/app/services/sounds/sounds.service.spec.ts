import { TestBed } from '@angular/core/testing';
import { Howl } from 'howler';

import { SoundsService } from './sounds.service';

describe('SoundsService', () => {
  let service: SoundsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SoundsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load music files', () => {
    expect(service['classicalInstructionsSound']).not.toEqual(jasmine.anything());
    expect(service['rockInstructionsSound']).not.toEqual(jasmine.anything());
    expect(service['jazzInstructionsSound']).not.toEqual(jasmine.anything());
    expect(service['danceInstructionsSound']).not.toEqual(jasmine.anything());
    expect(service['surpriseInstructionsSound']).not.toEqual(jasmine.anything());
    expect(service['calibrationSuccessSound']).not.toEqual(jasmine.anything());
    expect(service['calibrationErrorSound']).not.toEqual(jasmine.anything());

    service.loadMusicFiles('surprise me!');
    expect(service['surpriseInstructionsSound']).toBeInstanceOf(Howl);

    service.loadMusicFiles('dance');
    expect(service['danceInstructionsSound']).toBeInstanceOf(Howl);

    service.loadMusicFiles('rock');
    expect(service['rockInstructionsSound']).toBeInstanceOf(Howl);

    service.loadMusicFiles('classical');
    expect(service['classicalInstructionsSound']).toBeInstanceOf(Howl);

    service.loadMusicFiles('jazz');
    expect(service['jazzInstructionsSound']).toBeInstanceOf(Howl);

    expect(service['calibrationSuccessSound']).toBeInstanceOf(Howl);
    expect(service['calibrationErrorSound']).toBeInstanceOf(Howl);
  });

  it('should play activity classical instruction sound', () => {
    spyOn(Howl.prototype, 'volume');
    spyOn(Howl.prototype, 'play');
    spyOn(Howl.prototype, 'playing').and.returnValue(false);

    service.loadMusicFiles('classical');
    service.playActivityInstructionSound('classical');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.volume).toHaveBeenCalled();
    expect(Howl.prototype.play).toHaveBeenCalled();
  });

  it('should play activity jazz instruction sound', () => {
    spyOn(Howl.prototype, 'volume');
    spyOn(Howl.prototype, 'play');
    spyOn(Howl.prototype, 'playing').and.returnValue(false);

    service.loadMusicFiles('jazz');
    service.playActivityInstructionSound('jazz');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.volume).toHaveBeenCalled();
    expect(Howl.prototype.play).toHaveBeenCalled();
  });

  it('should play activity rock instruction sound', () => {
    spyOn(Howl.prototype, 'volume');
    spyOn(Howl.prototype, 'play');
    spyOn(Howl.prototype, 'playing').and.returnValue(false);

    service.loadMusicFiles('rock');
    service.playActivityInstructionSound('rock');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.volume).toHaveBeenCalled();
    expect(Howl.prototype.play).toHaveBeenCalled();
  });

  it('should play activity dance instruction sound', () => {
    spyOn(Howl.prototype, 'volume');
    spyOn(Howl.prototype, 'play');
    spyOn(Howl.prototype, 'playing').and.returnValue(false);

    service.loadMusicFiles('dance');
    service.playActivityInstructionSound('dance');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.volume).toHaveBeenCalled();
    expect(Howl.prototype.play).toHaveBeenCalled();
  });

  it('should play activity surprise instruction sound', () => {
    spyOn(Howl.prototype, 'volume');
    spyOn(Howl.prototype, 'play');
    spyOn(Howl.prototype, 'playing').and.returnValue(false);

    service.loadMusicFiles('surprise me!');
    service.playActivityInstructionSound('surprise me!');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.volume).toHaveBeenCalled();
    expect(Howl.prototype.play).toHaveBeenCalled();
  });

  it('should not play activity instruction sound if already playing', () => {
    spyOn(Howl.prototype, 'volume');
    spyOn(Howl.prototype, 'play');
    spyOn(Howl.prototype, 'playing').and.returnValue(true);

    service.loadMusicFiles('classical');
    service.playActivityInstructionSound('classical');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.play).not.toHaveBeenCalled();
    expect(Howl.prototype.volume).not.toHaveBeenCalled();
  });

  it('should pause activity classical instruction sound', () => {
    spyOn(Howl.prototype, 'playing').and.returnValue(true);
    spyOn(Howl.prototype, 'pause');

    service.loadMusicFiles('classical');
    service.pauseActivityInstructionSound('classical');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.pause).toHaveBeenCalled();
  });

  it('should pause activity jazz instruction sound', () => {
    spyOn(Howl.prototype, 'playing').and.returnValue(true);
    spyOn(Howl.prototype, 'pause');

    service.loadMusicFiles('jazz');
    service.pauseActivityInstructionSound('jazz');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.pause).toHaveBeenCalled();
  });

  it('should pause activity rock instruction sound', () => {
    spyOn(Howl.prototype, 'playing').and.returnValue(true);
    spyOn(Howl.prototype, 'pause');

    service.loadMusicFiles('rock');
    service.pauseActivityInstructionSound('rock');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.pause).toHaveBeenCalled();
  });

  it('should pause activity dance instruction sound', () => {
    spyOn(Howl.prototype, 'playing').and.returnValue(true);
    spyOn(Howl.prototype, 'pause');

    service.loadMusicFiles('dance');
    service.pauseActivityInstructionSound('dance');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.pause).toHaveBeenCalled();
  });

  it('should pause activity surprise instruction sound', () => {
    spyOn(Howl.prototype, 'playing').and.returnValue(true);
    spyOn(Howl.prototype, 'pause');

    service.loadMusicFiles('surprise me!');
    service.pauseActivityInstructionSound('surprise me!');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.pause).toHaveBeenCalled();
  });

  it('should not pause activity instruction sound if not playing', () => {
    spyOn(Howl.prototype, 'playing').and.returnValue(false);
    spyOn(Howl.prototype, 'pause');

    service.loadMusicFiles('classical');
    service.pauseActivityInstructionSound('classical');

    expect(Howl.prototype.playing).toHaveBeenCalled();
    expect(Howl.prototype.pause).not.toHaveBeenCalled();
  });

  it('should play calibration success sound', () => {
    spyOn(Howl.prototype, 'play');

    service.loadMusicFiles('classical');
    service.playCalibrationSound('success');

    expect(Howl.prototype.play).toHaveBeenCalled();
  });

  it('should play calibration error sound', () => {
    spyOn(Howl.prototype, 'play');

    service.loadMusicFiles('classical');
    service.playCalibrationSound('error');

    expect(Howl.prototype.play).toHaveBeenCalled();
  });
});
