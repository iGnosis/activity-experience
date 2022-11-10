import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RibbonService } from './ribbon.service';

describe('RibbonService', () => {
  let service: RibbonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RibbonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should setup initial subject', () => {
    expect(service._subject).toBeInstanceOf(Subject);
  });

  it('should setup initial state', () => {
    expect(service._state).toEqual({
      data: {},
      attributes: {},
    });
  });
});
