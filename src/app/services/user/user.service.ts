import { Injectable } from '@angular/core';
import { GqlClientService } from '../gql-client/gql-client.service';
import jwtDecode from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private gqlClientService: GqlClientService) {}

  debug() {
    console.log('hello from user.service');
  }

  handleToken(data: any) {
    if (data.data.type === 'token') {
      localStorage.setItem('token', data.data.token);
      this.setPatient(data.data.token);
      this.gqlClientService.refreshClient(data.data.token);
      return true;
    } else {
      return false;
    }
  }
  setPatient(token: string) {
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const hasuraJWTClaims = decodedToken['https://hasura.io/jwt/claims'];
      console.log('decoded: ', hasuraJWTClaims);
      if ('x-hasura-user-id' in hasuraJWTClaims) {
        localStorage.setItem('patient', hasuraJWTClaims['x-hasura-user-id']);
      }
    }
  }
}
