import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {}

  async getOrganizationTheme(organization = 'pointmotion'): Promise<any> {
    return new Promise((resolve) => {
      // dummy api
      resolve(
        {
          arboracres: {
            theme: {
              primary: '#39B54A',
              success: '#000066',
              warning: '#FFB000',
              info: '#2F51AE',
              danger: '#CBD5E0',
              secondary: '#f5f9fc',
              'border-light': '#EB0000',
            },
            font: {
              // family: 'Rubik Bubbles',
              // url: 'https://fonts.googleapis.com/css?family=Rubik+Bubbles&display=swap',
            },
          },
          pointmotion: {
            theme: {
              primary: '#000066',
              success: '#39B54A',
              warning: '#FFB000',
              info: '#2F51AE',
              danger: '#EB0000',
              secondary: '#f5f9fc',
              'border-light': '#CBD5E0',
            },
            font: {},
          },
        }[organization],
      );
    });
  }

  setTheme(theme: any) {
    if (!theme) return;

    Object.keys(theme).forEach((key) => {
      document.documentElement.style.setProperty(`--${key}`, theme[key]);
    });
  }

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
