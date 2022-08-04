import { Injectable } from '@angular/core';
import { Event, NavigationEnd, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GoogleAnalyticsService {
  constructor(router: Router) {
    // No need to call a specific function, so doing it in the constructor itself
    this.setupGA();
    router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.trackPageView(event);
      }
    });
  }

  setupGA() {
    console.log('setting up GA');
    const script = document.createElement('script');
    script.src =
      'https://www.googletagmanager.com/gtag/js?id=' + environment.googleAnalyticsTrackingID;
    script.async = true;
    document.body.appendChild(script);

    setTimeout(() => {
      const script = document.createElement('script');
      script.innerHTML = `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
    
      gtag('config', '${environment.googleAnalyticsTrackingID}', {send_page_view: false});`;
      document.body.appendChild(script);
    }, 500);
  }

  trackPageView(event: NavigationEnd) {
    window.gtag('event', 'page_view', {
      page_title: event.id,
      page_location: event.url,
      page_path: event.url,
      send_to: environment.googleAnalyticsTrackingID,
    });
  }
}
