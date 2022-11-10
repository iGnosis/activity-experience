import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
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
        body: '',
        header: '',
      },
      attributes: {},
    });
  });
});
