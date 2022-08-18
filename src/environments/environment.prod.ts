import { Environment } from 'src/app/types/pointmotion';

export const environment: Environment = {
  stageName: 'prod',
  production: true,
  speedUpSession: false,
  analytics: {
    calibration: true,
  },
  googleAnalyticsTrackingID: 'G-MTGG72G6ND',
  endpoint: 'https://api.prod.pointmotioncontrol.com/v1/graphql',
  apiEndpoint: 'https://services.prod.pointmotioncontrol.com',
  postSessionRedirectEndpoint: 'https://provider.prod.pointmotioncontrol.com',
  order: ['sit_stand_achieve', 'beat_boxer'],
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
        minCorrectReps: 10,
        speed: 5000,
      },
    },
  },
};
