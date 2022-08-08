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
    } catch (err) {
      throw new Error('Unable to fetch genre');
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

      return onboardingStatus.update_patient_by_pk;
    } catch (err) {
      console.log(err);
    }
  }

  async getLastGame(today: string) {
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

  async getFastestTime() {
    try {
      const fastestTime = await this.client.req(
        gql`
          query GetFastestTime {
            game(
              limit: 1
              order_by: { totalDuration: asc_nulls_last }
              where: { endedAt: { _is_null: false } }
            ) {
              id
              totalDuration
            }
          }
        `,
      );

      return fastestTime.game[0].totalDuration;
    } catch (err) {
      console.log(err);
    }
  }
}
