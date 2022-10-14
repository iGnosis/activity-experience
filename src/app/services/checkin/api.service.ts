import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { gql } from 'graphql-request';
import { preference } from 'src/app/store/actions/preference.actions';
import { AnalyticsDTO, GameState, Genre, PreferenceState } from 'src/app/types/pointmotion';
import { GqlClientService } from '../gql-client/gql-client.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(
    private store: Store<{
      preference: PreferenceState;
    }>,
    private client: GqlClientService,
  ) {}

  async newGame(game: string) {
    return this.client.req(
      gql`
        mutation newGame($game: game_name_enum = sit_stand_achieve) {
          insert_game_one(object: { game: $game }) {
            id
          }
        }
      `,
      {
        game,
      },
    );
  }

  async updateGame(id: string, game: GameState) {
    return this.client.req(
      gql`
        mutation UpdateGame($id: uuid!, $game: game_set_input = {}) {
          update_game_by_pk(pk_columns: { id: $id }, _set: $game) {
            id
          }
        }
      `,
      {
        id,
        game,
      },
    );
  }

  async updateAnalytics(gameId: string, analytics: AnalyticsDTO) {
    return this.client.req(
      gql`
        mutation UpdateAnalytics($analytics: jsonb!, $gameId: uuid!) {
          update_game_by_pk(pk_columns: { id: $gameId }, _append: { analytics: $analytics }) {
            id
          }
        }
      `,
      {
        gameId,
        analytics,
      },
    );
  }

  // called after completion of a game.
  async updateRewards(startDate: Date, endDate: Date, userTimezone: string) {
    // unlocks rewards based on recent user activity.
    this.client.req(
      gql`
        mutation UpdateRewards($startDate: String!, $endDate: String!, $userTimezone: String!) {
          updateRewards(startDate: $startDate, endDate: $endDate, userTimezone: $userTimezone) {
            status
          }
        }
      `,
      { startDate, endDate, userTimezone },
    );
  }

  async gameCompleted(startDate: Date, endDate: Date, currentDate: Date, userTimezone: string) {
    this.client.req(
      `mutation GameCompleted($startDate: String!, $endDate: String!, $currentDate: String!, $userTimezone: String!) {
      gameCompleted(startDate: $startDate, endDate: $endDate, currentDate: $currentDate, userTimezone: $userTimezone) {
        status
      }
    }`,
      { startDate, endDate, currentDate, userTimezone },
    );
  }

  async getUserGenre(): Promise<Genre | void> {
    try {
      const userGenre = await this.client.req(
        gql`
          query GetCheckinData {
            genre: checkin(
              limit: 1
              order_by: { createdAt: desc }
              where: { type: { _eq: genre } }
            ) {
              type
              value
            }
          }
        `,
      );

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
      const onboardingStatus = await this.client.req(
        gql`
          query GetOnboardingStatus {
            patient {
              onboardingStatus
            }
          }
        `,
      );

      return onboardingStatus.patient;
    } catch (err) {
      console.log(err);
    }
  }

  async updateOnboardingStatus(status: any) {
    try {
      const id = localStorage.getItem('patient');

      const onboardingStatus = await this.client.req(
        gql`
          mutation updateOnboardingStatus($onboardingStatus: jsonb!, $id: uuid!) {
            update_patient(
              where: { id: { _eq: $id } }
              _append: { onboardingStatus: $onboardingStatus }
            ) {
              returning {
                onboardingStatus
              }
            }
          }
        `,
        {
          onboardingStatus: status,
          id,
        },
      );

      return onboardingStatus.data.update_patient.returning[0].onboardingStatus;
    } catch (err) {
      console.log(err);
    }
  }

  async getBenchmarkConfig(id: string): Promise<any> {
    try {
      const result = await this.client.req(
        gql`
          query GetBenchmarkConfig($id: uuid = "") {
            game_benchmark_config_by_pk(id: $id) {
              originalGameId
              rawVideoUrl
            }
          }
        `,
        {
          id,
        },
      );

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
      const result = await this.client.req(
        gql`
          mutation SaveAutoBenchmark(
            $analytics: jsonb!
            $gameId: uuid!
            $systemSpec: jsonb = {}
            $originalGameId: uuid = ""
          ) {
            insert_game_benchmarks_one(
              object: {
                analytics: $analytics
                gameId: $gameId
                systemSpec: $systemSpec
                originalGameId: $originalGameId
              }
            ) {
              id
            }
          }
        `,
        { gameId, analytics, systemSpec, originalGameId },
      );

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

  async getLastGame() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const lastGame = await this.client.req(
        gql`
          query GetLastGame($today: timestamptz = "") {
            game(limit: 1, order_by: { endedAt: desc }, where: { endedAt: { _gte: $today } }) {
              id
              game
            }
          }
        `,
        { today },
      );

      return lastGame.game;
    } catch (err) {
      console.log(err);
    }
  }

  async getLastPlayedGame() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const lastGame = await this.client.req(
        gql`
          query GetLastGame($today: timestamptz = "") {
            game(limit: 1, order_by: { createdAt: desc }, where: { createdAt: { _gte: $today } }) {
              id
              game
              endedAt
            }
          }
        `,
        { today },
      );

      return lastGame.game;
    } catch (err) {
      console.log(err);
    }
  }

  async getBenchmarkGame(id: string) {
    try {
      const nextGame = await this.client.req(
        gql`
          query GetBenchmarkGame($id: uuid = "") {
            game_by_pk(id: $id) {
              analytics
              game
              id
            }
          }
        `,
        { id },
      );

      return nextGame.game_by_pk;
    } catch (err) {
      console.log(err);
    }
  }

  async getFastestTime(game: string) {
    try {
      const fastestTime = await this.client.req(
        gql`
          query GetFastestTime($game: game_name_enum = sit_stand_achieve) {
            game(
              limit: 1
              order_by: { totalDuration: asc_nulls_last }
              where: { endedAt: { _is_null: false }, _and: { game: { _eq: $game } } }
            ) {
              id
              totalDuration
            }
          }
        `,
        { game },
      );

      return fastestTime.game[0].totalDuration;
    } catch (err) {
      console.log(err);
    }
  }

  async getHighScore(game: string) {
    try {
      const highScore = await this.client.req(
        gql`
          query GetHighScore($game: game_name_enum = beat_boxer) {
            game(
              limit: 1
              order_by: { repsCompleted: desc_nulls_last }
              where: { endedAt: { _is_null: false }, _and: { game: { _eq: $game } } }
            ) {
              id
              repsCompleted
            }
          }
        `,
        { game },
      );

      return highScore.game;
    } catch (err) {
      console.log(err);
    }
  }

  getDurationForTimer(totalSeconds: number): {
    minutes: string;
    seconds: string;
  } {
    let minutes = 0;
    if (totalSeconds >= 60) {
      minutes = Math.floor(totalSeconds / 60);
      totalSeconds -= 60 * minutes;
    }
    let time = { minutes: '0', seconds: '00' };
    time = {
      minutes:
        minutes < 10
          ? (time.minutes = '0' + minutes.toString())
          : (time.minutes = minutes.toString()),
      seconds:
        totalSeconds < 10
          ? (time.seconds = '0' + totalSeconds.toString())
          : (time.seconds = totalSeconds.toString()),
    };
    return time;
  }
}
