// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  production: false,
  // harmless stage environment token, TODO: pick up token from localStorage when end to end flow is implemented
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiJBbWFuIiwibGFzdE5hbWUiOiJHYXV0YW0iLCJpZCI6IjkyMDBjMjY1LTM2NzEtNDc3Zi1iZWZjLWFmYjYyN2RlN2NlNSIsInByb3ZpZGVyIjoiZWU0Yjc3MWEtMzJlNS00YWRlLTlhYTItZjk4Njc5MDgwZTUxIiwiaHR0cHM6Ly9oYXN1cmEuaW8vand0L2NsYWltcyI6eyJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbInBhdGllbnQiLCJ0aGVyYXBpc3QiLCJhZG1pbiJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ0aGVyYXBpc3QiLCJ4LWhhc3VyYS11c2VyLWlkIjoiOTIwMGMyNjUtMzY3MS00NzdmLWJlZmMtYWZiNjI3ZGU3Y2U1IiwieC1oYXN1cmEtcHJvdmlkZXItaWQiOiJlZTRiNzcxYS0zMmU1LTRhZGUtOWFhMi1mOTg2NzkwODBlNTEifSwiaWF0IjoxNjUyMTAzODM1fQ.lCbvg9Y2ZadLnm1D4u_5ED5_qspwl7CNaTfOC5TSkm4',
  endpoint: 'https://api.stage.pointmotioncontrol.com/v1/graphql',
  analytics: {
    calibration: true,
  },
  patient: '3e0339fd-79f6-4559-a94c-788c8891710e',
  careplan: '4e2aa726-b07f-4f44-a4fd-fc228c93bfc7',
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
