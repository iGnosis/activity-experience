import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { GoogleAnalyticsService } from './google-analytics.service';

describe('GoogleAnalyticsService', () => {
  let service: GoogleAnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
    });
    service = TestBed.inject(GoogleAnalyticsService);

    window.gtag = () => {};
    spyOn(window, 'gtag');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should track page view', () => {
    service.trackPageView({
      id: 2234,
      url: 'url',
      urlAfterRedirects: '',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_title: 2234,
      page_location: 'url',
      page_path: 'url',
      send_to: environment.googleAnalyticsTrackingID,
    });
  });

  it('should set user id', () => {
    service.setUserId('user_id');

    expect(window.gtag).toHaveBeenCalledWith('config', environment.googleAnalyticsTrackingID, {
      user_id: 'user_id',
    });
  });

  it('should not set empty user id', () => {
    service.setUserId('');

    expect(window.gtag).not.toHaveBeenCalledWith();
  });

  it('should send event to Google analytics', () => {
    service.sendEvent('test');

    expect(window.gtag).toHaveBeenCalledWith('event', 'test');
  });

  it('should send event and params to Google analytics', () => {
    service.sendEvent('test', {
      test_param: 'test_value',
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'test', {
      test_param: 'test_value',
    });
  });

  it('should set user id', () => {
    service.setUserId('test_user_id');

    expect(window.gtag).toHaveBeenCalledWith('config', environment.googleAnalyticsTrackingID, {
      user_id: 'test_user_id',
    });
  });
});
