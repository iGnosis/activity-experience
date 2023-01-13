import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { QaService } from './qa.service';

describe('QaService', () => {
  let service: QaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(QaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
