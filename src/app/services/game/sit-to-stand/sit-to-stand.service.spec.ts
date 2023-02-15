import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { SitToStandService } from './sit-to-stand.service';

describe('SitToStandService', () => {
  let service: SitToStandService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(SitToStandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
