import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { ActivityHelperService } from './activity-helper.service';

describe('ActivityHelperService', () => {
  let service: ActivityHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(ActivityHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
