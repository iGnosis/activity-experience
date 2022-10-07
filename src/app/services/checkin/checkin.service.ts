import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { gql } from 'graphql-request';
import { preference } from 'src/app/store/actions/preference.actions';
import { Genre, PreferenceState } from 'src/app/types/pointmotion';
import { GqlClientService } from '../gql-client/gql-client.service';

@Injectable({
  providedIn: 'root',
})
export class CheckinService {
  constructor(
    private store: Store<{
      preference: PreferenceState;
    }>,
    private client: GqlClientService,
  ) {}

  // * Mood is not being used ATM
  // async getUserGenreAndMood() {
  //   const userGenreAndMood = await this.client.req(
  //     gql`
  //       query GetCheckinData {
  //         genre: checkin(limit: 1, order_by: { createdAt: desc }, where: { type: { _eq: genre } }) {
  //           type
  //           value
  //         }
  //         mood: checkin(limit: 1, order_by: { createdAt: desc }, where: { type: { _eq: mood } }) {
  //           type
  //           value
  //         }
  //       }
  //     `,
  //   );
  // }

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

  async saveAutoBenchmark(gameId: string, analytics: any[], systemSpec?: any) {
    try {
      const result = await this.client.req(
        gql`
          mutation SaveAutoBenchmark($analytics: jsonb!, $gameId: uuid!, $systemSpec: jsonb = {}) {
            insert_game_benchmarks_one(
              object: { analytics: $analytics, gameId: $gameId, systemSpec: $systemSpec }
            ) {
              id
            }
          }
        `,
        { gameId, analytics, systemSpec },
      );

      return result.insert_game_benchmarks_one;
    } catch (err) {
      console.log(err);
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
