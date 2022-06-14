import { Injectable } from '@angular/core';
import { gql } from 'graphql-request';
import { PreSessionGenre, PreSessionMood } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { GqlClientService } from '../gql-client/gql-client.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  sessionId: string | undefined;

  constructor(private client: GqlClientService) {}

  // async new() {
  //   return this.client.req(
  //     gql`
  //       mutation StartSession($careplan: uuid!, $patient: uuid!) {
  //         insert_session_one(object: { careplan: $careplan, patient: $patient }) {
  //           id
  //           createdAt
  //           updatedAt
  //           careplan
  //           patient
  //         }
  //       }
  //     `,
  //     {
  //       careplan: environment.careplan,
  //       patient: environment.patient,
  //     },
  //   );
  // }

  async getSession(id: string) {
    this.sessionId = id;
    return this.client.req(
      gql`
        query GetSessionDetails($id: uuid!) {
          session_by_pk(id: $id) {
            id
            patient
            careplan
            state
            patientByPatient {
              identifier
              preferredGenres
            }
            careplanByCareplan {
              name
              careplan_activities {
                activity
                activityByActivity {
                  name
                }
              }
            }
          }
        }
      `,
      { id },
    );
  }

  async updatePreSessionMood(mood: PreSessionMood) {
    if (!this.sessionId) {
      console.error('session id not defined. sessionService.get should be called first');
      return;
    }
    return this.client.req(
      gql`
        mutation UpdateSession($id: uuid!, $mood: String) {
          update_session_by_pk(pk_columns: { id: $id }, _set: { preSessionMood: $mood }) {
            updatedAt
          }
        }
      `,
      {
        mood,
        id: this.sessionId,
      },
    );
  }

  async updatePostSessionMood(mood: string) {
    if (!this.sessionId) {
      console.error('session id not defined. sessionService.get should be called first');
      return;
    }
    return this.client.req(
      gql`
        mutation UpdateSession($id: uuid!, $mood: String) {
          update_session_by_pk(pk_columns: { id: $id }, _set: { postSessionMood: $mood }) {
            updatedAt
          }
        }
      `,
      {
        mood,
        id: this.sessionId,
      },
    );
  }

  async updateGenre(genre: PreSessionGenre) {
    if (!this.sessionId) {
      console.error('session id not defined. sessionService.get should be called first');
      return;
    }
    return this.client.req(
      gql`
        mutation UpdateSession($id: uuid!, $genre: String) {
          update_session_by_pk(pk_columns: { id: $id }, _set: { genre: $genre }) {
            updatedAt
          }
        }
      `,
      {
        genre,
        id: this.sessionId,
      },
    );
  }
}
