// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  stageName: 'local',
  production: false,
  speedUpSession: false,
  analytics: {
    calibration: true,
  },
  endpoint: 'https://api.dev.pointmotioncontrol.com/v1/graphql',
  apiEndpoint: 'https://services.dev.pointmotioncontrol.com',
  postSessionRedirectEndpoint: 'http://localhost:4200',
  order: ['sit.stand.achieve', 'beat.boxer', 'sound.slicer'],
  settings: {
    'sit.stand.achieve': {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
      },
    },
    'beat.boxer': {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
      },
    },
    'sound.slicer': {
      configuration: {
        minCorrectReps: 10,
        speed: 5000,
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
