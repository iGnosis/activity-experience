// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  organizationName: 'pointmotion',
  stageName: 'dev',
  production: false,
  speedUpSession: false,
  analytics: {
    calibration: true,
  },
  googleAnalyticsTrackingID: 'G-MTGG72G6ND',
  endpoint: 'https://api.dev.pointmotioncontrol.com/v1/graphql',
  apiEndpoint: 'https://services.dev.pointmotioncontrol.com',
  websocketEndpoint: 'wss://services.dev.pointmotioncontrol.com',
  postSessionRedirectEndpoint: 'https://provider.dev.pointmotioncontrol.com',
  order: ['sit_stand_achieve', 'beat_boxer', 'sound_explorer', 'moving_tones'],
  settings: {
    sit_stand_achieve: {
      currentLevel: 'level1',
      levels: {
        level1: {
          configuration: {
            minCorrectReps: 10,
            speed: 7000,
          },
          rules: ['Sit down when you see an even number', 'Stand up when you see an odd number'],
        },
        level2: {
          configuration: {
            minCorrectReps: 17,
            speed: 7000,
          },
          rules: [''],
        },
        level3: {
          configuration: {
            minCorrectReps: 20,
            speed: 7000,
          },
          rules: [''],
        },
      },
    },
    beat_boxer: {
      currentLevel: 'level1',
      levels: {
        level1: {
          configuration: {
            gameDuration: 3 * 60,
            speed: 2500,
          },
          rules: [''],
        },
      },
    },
    sound_explorer: {
      currentLevel: 'level1',
      levels: {
        level1: {
          configuration: {
            gameDuration: 3 * 60,
            speed: 400,
          },
          rules: [''],
        },
      },
    },
    moving_tones: {
      currentLevel: 'level1',
      levels: {
        level1: {
          configuration: {
            gameDuration: 3 * 60,
            speed: 1500,
          },
          rules: [''],
        },
      },
    },
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
