import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiService } from './services/checkin/api.service';
import { QaService } from './services/qa/qa.service';
import { ThemeService } from './services/theme/theme.service';
import { Theme } from './types/pointmotion';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'activities';
  constructor(private themeService: ThemeService, private qaService: QaService) {
    this.themeService.setTheme();
    this.qaService.init();
  }
}
