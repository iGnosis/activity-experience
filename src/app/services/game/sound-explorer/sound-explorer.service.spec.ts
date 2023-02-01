import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { SoundExplorerService } from './sound-explorer.service';

describe('SoundExplorerService', () => {
  let service: SoundExplorerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [provideMockStore({})],
    });
    service = TestBed.inject(SoundExplorerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
