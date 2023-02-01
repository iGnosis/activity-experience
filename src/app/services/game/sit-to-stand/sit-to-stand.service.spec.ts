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

  it('should increase value by 10%', () => {
    // Given
    const increaseByPercent = 10;
    const value = 100;

    // When
    const result = service.getPercentageChange(increaseByPercent, value);

    // Then
    expect(result).toBe(110);
  });

  it('should decrease value by 10%', () => {
    // Given
    const decreaseByPercent = -10;
    const value = 100;

    // When
    const result = service.getPercentageChange(decreaseByPercent, value);

    // Then
    expect(result).toBe(90);
  });
});
