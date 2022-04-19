import { TestBed } from '@angular/core/testing';
import { CoordinationService } from './coordination.service';


describe('CoordinationService', () => {
  let service: CoordinationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
