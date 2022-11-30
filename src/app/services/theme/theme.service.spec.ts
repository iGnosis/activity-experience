import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { provideMockStore } from '@ngrx/store/testing';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
