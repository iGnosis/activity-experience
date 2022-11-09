import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { BenchmarkService } from './benchmark.service';

describe('BenchmarkService', () => {
  let service: BenchmarkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(BenchmarkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
