// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import { Environment } from "src/app/types/pointmotion";

export const environment: Environment = {
  production: false,
  // harmless dev environment token, TODO: pick up token from localStorage when end to end flow is implemented
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiJBbWFuIiwibGFzdE5hbWUiOiJHYXV0YW0iLCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsicGF0aWVudCIsInRoZXJhcGlzdCIsImFkbWluIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InRoZXJhcGlzdCIsIngtaGFzdXJhLXVzZXItaWQiOiJkODVlMjMxNS0yNGQyLTQ1OTMtODZmZi1mOTcwMGMyZTZhYzQiLCJ4LWhhc3VyYS1wcm92aWRlci1pZCI6IjIwZTY2MTMyLWQ1YjQtNGE3My1iNDU4LWRkMTkyNjVkNmRiYSJ9LCJpYXQiOjE2NDM5NzYyODF9.Tlzven_qWYRS4bLXwjvAi1_BefRYl3Pr8qd3cUPrX5Q',
  endpoint: 'https://api.dev.pointmotioncontrol.com/v1/graphql',
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
