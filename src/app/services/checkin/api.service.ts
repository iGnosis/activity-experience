import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { preference } from 'src/app/store/actions/preference.actions';
import {
  Activities,
  ActivityConfiguration,
  AnalyticsDTO,
  GameState,
  Genre,
  PreferenceState,
} from 'src/app/types/pointmotion';
import { GqlClientService } from '../gql-client/gql-client.service';
import { environment } from 'src/environments/environment';
import { HandTrackerService } from '../classifiers/hand-tracker/hand-tracker.service';
import { GqlConstants } from '../gql-constants';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private store: Store<{
      preference: PreferenceState;
    }>,
    private client: GqlClientService,
    private handTrackerService: HandTrackerService,
  ) {}

  async newGame(game: string) {
    return this.client.req(GqlConstants.NEW_GAME, {
      game,
    });
  }

  async updateGame(id: string, game: GameState) {
    return this.client.req(GqlConstants.UPDATE_GAME, {
      id,
      game,
    });
  }

  async updateAnalytics(gameId: string, analytics: AnalyticsDTO) {
    return this.client.req(GqlConstants.UPDATE_ANALYTICS, {
      gameId,
      analytics,
    });
  }

  // called after completion of a game.
  async updateRewards(startDate: Date, endDate: Date, userTimezone: string) {
    // unlocks rewards based on recent user activity.
    this.client.req(GqlConstants.UPDATE_REWARDS, { startDate, endDate, userTimezone });
  }

  async gameCompleted(startDate: Date, endDate: Date, currentDate: Date, userTimezone: string) {
    this.client.req(GqlConstants.GAME_COMPLETED, { startDate, endDate, currentDate, userTimezone });
  }

  async getUserGenre(): Promise<Genre | void> {
    try {
      const userGenre = await this.client.req(GqlConstants.GET_CHECKIN_DATA);

      const genre: Genre = userGenre.genre[0].value;
      this.store.dispatch(
        preference.updateGenre({
          genre,
        }),
      );
      return genre;
    } catch (err) {
      console.log('Unable to fetch genre');
    }
  }

  async getOnboardingStatus() {
    try {
      const onboardingStatus = await this.client.req(GqlConstants.GET_ONBOARDING_STATUS);

      return onboardingStatus.patient;
    } catch (err) {
      console.log(err);
    }
  }

  async updateOnboardingStatus(status: any) {
    try {
      const id = localStorage.getItem('patient');

      const onboardingStatus = await this.client.req(GqlConstants.UPDATE_ONBOARDING_STATUS, {
        onboardingStatus: status,
        id,
      });

      return onboardingStatus.data.update_patient.returning[0].onboardingStatus;
    } catch (err) {
      console.log(err);
    }
  }

  async getBenchmarkConfig(id: string): Promise<any> {
    try {
      const result = await this.client.req(GqlConstants.GET_BENCHMARK_CONFIG, {
        id,
      });

      return result.game_benchmark_config_by_pk;
    } catch (err) {
      console.log(err);
    }
  }

  async saveAutoBenchmark(
    gameId: string,
    originalGameId: string,
    analytics: any[],
    systemSpec?: any,
  ) {
    try {
      const result = await this.client.req(GqlConstants.SAVE_AUTO_BENCHMARK, {
        gameId,
        analytics,
        systemSpec,
        originalGameId,
      });

      return result.insert_game_benchmarks_one;
    } catch (err) {
      console.log(err);
    }
  }

  async generateBenchmarkReport(benchmarkId: string, gameId: string) {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        headers: {
          responseType: 'arraybuffer',
          Authorization: `Bearer ${token}`,
        },
      };
      const url = `${environment.apiEndpoint}/game-benchmarking/report?newGameId=${gameId}&benchmarkConfigId=${benchmarkId}`;

      return fetch(url, headers).then((res: any) => res.blob());
    } catch (err) {
      console.log(err);
      return err;
    }
  }

  async getGameSettings(gameName: Activities) {
    try {
      const gameSettings = await this.client.req(GqlConstants.GET_GAME_SETTINGS, { gameName });
      return gameSettings.game_settings[0];
    } catch (err) {
      console.log(err);
    }
  }

  async updateGameSettings(gameName: Activities, settings: ActivityConfiguration) {
    try {
      const updateSettingsResp = await this.client.req(GqlConstants.UPDATE_GAME_SETTINGS, {
        gameName,
        configuration: settings,
      });
      return updateSettingsResp;
    } catch (err) {
      console.log(err);
    }
  }
  async setGenre(genre: Genre) {
    try {
      const response = await this.client.req(GqlConstants.USER_DAILY_CHECKIN, {
        type: 'genre',
        value: genre,
      });
      return response;
    } catch (err) {
      console.log(err);
    }
  }
  async insertGameSettings(gameName: Activities, settings: ActivityConfiguration) {
    try {
      const insertSettingsResp = await this.client.req(GqlConstants.INSERT_GAME_SETTINGS, {
        gameName,
        configuration: settings,
      });
      return insertSettingsResp;
    } catch (err) {
      console.log(err);
    }
  }

  async getLastGame() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const lastGame = await this.client.req(GqlConstants.GET_LAST_GAME, { today });

      return lastGame.game;
    } catch (err) {
      console.log(err);
    }
  }

  async getLastPlayedGame() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const lastGame = await this.client.req(GqlConstants.GET_LAST_PLAYED_GAME, { today });

      return lastGame.game;
    } catch (err) {
      console.log(err);
    }
  }

  async getBenchmarkGame(id: string) {
    try {
      const nextGame = await this.client.req(GqlConstants.GET_BENCHMARK_GAME, { id });

      return nextGame.game_by_pk;
    } catch (err) {
      console.log(err);
    }
  }

  async getFastestTime(game: string) {
    try {
      const fastestTime = await this.client.req(GqlConstants.GET_FASTEST_TIME, { game });

      return fastestTime.game[0].totalDuration;
    } catch (err) {
      console.log(err);
    }
  }

  async getHighScore(game: string) {
    try {
      const highScore = await this.client.req(GqlConstants.GET_HIGHSCORE, { game });

      return highScore.game;
    } catch (err) {
      console.log(err);
    }
  }

  async getOrganizationConfig(name: string) {
    try {
      const response = await this.client.req(GqlConstants.GET_ORGANIZATION_CONFIG, { name });
      return response.organization && response.organization[0];
    } catch (err) {
      console.log(err);
    }
  }
}
