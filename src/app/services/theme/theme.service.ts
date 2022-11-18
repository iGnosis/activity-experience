import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {}

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
}
