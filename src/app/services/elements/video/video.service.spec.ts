import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { VideoService } from './video.service';

describe('VideoService', () => {
  let service: VideoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup initial subject', () => {
    expect(service._subject).toBeInstanceOf(Subject);
  });

  it('should setup initial state', () => {
    expect(service._state).toEqual({
      data: {
        type: 'gif',
        src: '',
        title: '',
        description: '',
      },
      attributes: {},
    });
  });
});
