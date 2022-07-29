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
  endpoint: 'https://api.stage.pointmotioncontrol.com/v1/graphql',
  apiEndpoint: 'https://services.stage.pointmotioncontrol.com',
  postSessionRedirectEndpoint: 'https://provider.stage.pointmotioncontrol.com',
  order: ['sit_stand_achieve'],
  settings: {
    sit_stand_achieve: {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
      },
    },
    beat_boxer: {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
      },
    },
    sound_slicer: {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
      },
    },
  },
};
