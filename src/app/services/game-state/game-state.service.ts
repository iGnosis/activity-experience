import { Injectable } from '@angular/core';
import { gql } from 'graphql-request';
import { GameState } from 'src/app/types/pointmotion';
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

  // called after completion of a game.
  async updateRewards() {
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(24, 0, 0, 0);

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
}
