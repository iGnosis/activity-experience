import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from '../checkin/api.service';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  logoSubject = new BehaviorSubject<string>('');

  constructor(private apiService: ApiService) {}

  /**
   * Setting the colors of the entire application.
   *
   * @param {{ [key: string]: any }} colors
   * @returns {void}
   */
  setColors(colors: { [key: string]: any }) {
    if (!colors) return;

    Object.keys(colors).forEach((color) => {
      document.documentElement.style.setProperty(`--${color}`, colors[color]);
    });
  }

  /**
   * Setting the typography of the entire application.
   *
   * @param {{ family: string url: string }} font
   * @returns {void}
   */
  loadFont(font: { family: string; url: string }) {
    if (!font) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = font.url;
    document.getElementsByTagName('head')[0].appendChild(link);

    document.documentElement.style.setProperty(
      `--font-family`,
      `'${font.family}', Inter, 'Times New Roman', Times, serif`,
    );
  }

  private setLogoUrl(url: string) {
    this.logoSubject.next(url);
  }

  /**
   * Setting the theme of the application.
   *
   * @returns {Promise<void>}
   */
  async setTheme(): Promise<void> {
    const theme = await this.apiService.getOrganizationConfig(environment.organizationName);
    if (theme) {
      if (theme.colors) {
        this.setColors(theme.colors);
      }
      if (theme.font) {
        this.loadFont(theme.font);
      }
      if (theme.logoUrl) {
        this.setLogoUrl(theme.logoUrl);
      }
    }
  }
}
