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

  async getUserGenre() {
    try {
      const userGenreAndMood = await this.client.req(
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

      const genre: Genre = userGenreAndMood.genre[0].value;
      this.store.dispatch(
        preference.updateGenre({
          genre,
        }),
      );
    } catch (err) {
      throw new Error('Unable to fetch genre');
    }
  }

  async getLastGame() {
    try {
      const lastGame = await this.client.req(
        gql`
          query GetLastGame {
            game(limit: 1, order_by: { endedAt: desc }, where: { endedAt: { _is_null: false } }) {
              id
              game
            }
          }
        `,
      );

      return lastGame.game;
    } catch (err) {
      console.log(err);
    }
  }
}
