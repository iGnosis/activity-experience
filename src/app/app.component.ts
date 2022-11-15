import { Component } from '@angular/core';
import { GoogleAnalyticsService } from './services/google-analytics/google-analytics.service';
import { ThemeService } from './services/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'activities';
  constructor(private themeService: ThemeService) {
    this.themeService.getOrganizationTheme().then(({ theme, font }) => {
      this.themeService.setTheme(theme);
      this.themeService.loadFont(font);
    });
  }
}
