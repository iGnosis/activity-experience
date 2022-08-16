// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  stageName: 'stage',
  production: false,
  speedUpSession: false,
  analytics: {
    calibration: true,
  },
  googleAnalyticsTrackingID: 'G-MTGG72G6ND',
  endpoint: 'https://api.stage.pointmotioncontrol.com/v1/graphql',
  apiEndpoint: 'https://services.stage.pointmotioncontrol.com',
  postSessionRedirectEndpoint: 'https://provider.stage.pointmotioncontrol.com',
  order: ['sit_stand_achieve', 'beat_boxer', 'sound_explorer'],
  settings: {
    sit_stand_achieve: {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
      },
    },
    beat_boxer: {
      configuration: {
        gameDuration: 3 * 60,
        speed: 2500,
      },
    },
    sound_explorer: {
      configuration: {
        gameDuration: 30,
        speed: 2500,
      },
    },
  },
};
