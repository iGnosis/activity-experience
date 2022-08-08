import { Component } from '@angular/core';
import { GoogleAnalyticsService } from './services/google-analytics/google-analytics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'activities';
  constructor(private ga: GoogleAnalyticsService) {}
}
