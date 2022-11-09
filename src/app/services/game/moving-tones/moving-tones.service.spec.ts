import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { MovingTonesService } from './moving-tones.service';

describe('MovingTonesService', () => {
  let service: MovingTonesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(MovingTonesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
