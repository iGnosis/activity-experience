import { Injectable } from '@angular/core';
import { gql } from 'graphql-request';
import { AnalyticsDTO, AnalyticsResultDTO, GameState } from 'src/app/types/pointmotion';
import { GqlClientService } from '../gql-client/gql-client.service';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  constructor(private client: GqlClientService) {}

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
      `mutation UpdateAnalytics($analytics: jsonb!, $gameId: uuid!) {
        update_game_by_pk(pk_columns: { id: $gameId }, _append: { analytics: $analytics }) {
          id
        }
      }`,
      {
        gameId,
        analytics,
      },
    );
  }

  // called after completion of a game.
  async _updateRewards(startDate: Date, endDate: Date, userTimezone: string) {
    // unlocks rewards based on recent user activity.
    this.client.req(
      `mutation UpdateRewards($startDate: String!, $endDate: String!, $userTimezone: String!) {
      updateRewards(startDate: $startDate, endDate: $endDate, userTimezone: $userTimezone) {
        status
      }
    }`,
      { startDate, endDate, userTimezone },
    );
  }

  async _gameCompleted(startDate: Date, endDate: Date, currentDate: Date, userTimezone: string) {
    this.client.req(
      `mutation GameCompleted($startDate: String!, $endDate: String!, $currentDate: String!, $userTimezone: String!) {
      gameCompleted(startDate: $startDate, endDate: $endDate, currentDate: $currentDate, userTimezone: $userTimezone) {
        status
      }
    }`,
      { startDate, endDate, currentDate, userTimezone },
    );
  }

  // doing this becuase it's a pain to workout dates w.r.t user's timezone server-side...
  async postLoopHook() {
    console.log('game-state:postLoopHook');
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentDate = new Date();
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    startDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    endDate.setHours(24, 0, 0, 0);

    this._updateRewards(startDate, endDate, userTimezone);
    this._gameCompleted(startDate, endDate, currentDate, userTimezone);
  }
}
