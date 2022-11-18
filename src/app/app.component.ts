import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ApiService } from './services/checkin/api.service';
import { ThemeService } from './services/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'activities';
  constructor(private apiService: ApiService, private themeService: ThemeService) {
    this.apiService.getOrganizationConfig(environment.organizationName).then((theme) => {
      this.themeService.setColors(theme.colors);
      this.themeService.loadFont(theme.font);
    });
  }
}
