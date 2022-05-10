// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  production: false,
  // harmless dev environment token, TODO: pick up token from localStorage when end to end flow is implemented
  endpoint: 'https://api.dev.pointmotioncontrol.com/v1/graphql',
  analytics: {
    calibration: true,
  },
  apiEndpoint: 'https://services.dev.pointmotioncontrol.com',
  musicExperience: 'music_experience_2',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
