import { Injectable } from '@angular/core';
import { GqlClientService } from '../gql-client/gql-client.service';
import jwtDecode from 'jwt-decode';
import { GoogleAnalyticsService } from '../google-analytics/google-analytics.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private gqlClientService: GqlClientService,
    private googleAnalyticsService: GoogleAnalyticsService,
  ) {}

  /**
   * Setting the token in local storage.
   *
   * @param {any} data
   * @returns {boolean}
   */
  handleToken(data: {
    data: {
      type: string;
      token: string;
    };
  }): boolean {
    try {
      if (data?.data?.type === 'token' && data?.data?.token) {
        const decodedToken: any = jwtDecode(data.data.token);
        localStorage.setItem('token', data.data.token);
        this.setPatient(data.data.token);
        this.gqlClientService.refreshClient(data.data.token);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Setting the patient Id in local storage from jwt token.
   *
   * @param {string} token
   * @returns {void}
   */
  setPatient(token: string) {
    try {
      if (token) {
        const decodedToken: any = jwtDecode(token);
        const hasuraJWTClaims = decodedToken['https://hasura.io/jwt/claims'];
        console.log('decoded: ', hasuraJWTClaims);
        if ('x-hasura-user-id' in hasuraJWTClaims) {
          localStorage.setItem('patient', hasuraJWTClaims['x-hasura-user-id']);
          this.googleAnalyticsService.setUserId(hasuraJWTClaims['x-hasura-user-id']);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
