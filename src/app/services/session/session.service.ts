import { Injectable } from '@angular/core';
import { gql } from 'graphql-request';
import { PreSessionGenre, PreSessionMood } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { GqlClientService } from '../gql-client/gql-client.service';
import { JwtService } from '../jwt/jwt.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  sessionId: string | undefined;

  constructor(private client: GqlClientService, private jwtService: JwtService) {}

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

  async getUserSessionsBetweenDates(patient: string, startDate: Date, endDate: Date) {
    return this.client.req(
      gql`
        query fetchUserSessions(
          $patient: uuid = ""
          $startDate: timestamptz = ""
          $endDate: timestamptz = ""
        ) {
          session(
            where: {
              _and: { patient: { _eq: $patient }, state: { _is_null: false } }
              createdAt: { _gte: $startDate, _lte: $endDate }
            }
            order_by: { createdAt: desc }
          ) {
            id
            state
            genre
          }
        }
      `,
      {
        patient,
        startDate,
        endDate,
      },
    );
  }

  async getSession(id: string) {
    this.sessionId = id;
    let query = gql`
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
    `;

    if (this.jwtService.isPlayer()) {
      query = gql`
        query GetSessionDetails($id: uuid!) {
          session_by_pk(id: $id) {
            id
            patient
            state
            patientByPatient {
              identifier
              preferredGenres
            }
          }
        }
      `;
    }
    return this.client.req(query, { id });
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

  async getUserGenreAndMood() {
    return this.client.req(
      gql`
        query GetCheckinData {
          genre: checkin(limit: 1, order_by: { createdAt: desc }, where: { type: { _eq: genre } }) {
            type
            value
          }
          mood: checkin(limit: 1, order_by: { createdAt: desc }, where: { type: { _eq: mood } }) {
            type
            value
          }
        }
      `,
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
