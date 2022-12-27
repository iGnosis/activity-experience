// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  organizationName: 'pointmotion',
  stageName: 'local',
  production: false,
  speedUpSession: false,
  analytics: {
    calibration: true,
  },
  googleAnalyticsTrackingID: 'G-MTGG72G6ND',
  endpoint: 'https://api.dev.pointmotioncontrol.com/v1/graphql',
  apiEndpoint: 'https://services.dev.pointmotioncontrol.com',
  websocketEndpoint: 'ws://localhost:9000',
  postSessionRedirectEndpoint: 'http://localhost:4200',
  order: ['sit_stand_achieve', 'beat_boxer', 'sound_explorer', 'moving_tones'],
  settings: {
    sit_stand_achieve: {
      currentLevel: 'level1',
      levels: {
        level1: {
          configuration: {
            minCorrectReps: 15,
            speed: 5000,
          },
        },
        level2: {
          configuration: {
            minCorrectReps: 17,
            speed: 6500,
          },
        },
        level3: {
          configuration: {
            minCorrectReps: 20,
            speed: 6500,
          },
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
        },
      },
    },
    moving_tones: {
      currentLevel: 'level1',
      levels: {
        level1: {
          configuration: {
            gameDuration: 3 * 60,
            speed: 400,
          },
        },
      },
    },
  },
};