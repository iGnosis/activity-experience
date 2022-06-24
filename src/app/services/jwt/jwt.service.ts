import { Injectable } from '@angular/core';
import jwtDecode from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class JwtService {
  constructor() {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  checkCareplanAndProviderInJWT() {
    const token = this.getToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const hasuraJWTClaims = JSON.parse(decodedToken['https://hasura.io/jwt/claims'] as string);
      if ('x-hasura-careplan-id' in hasuraJWTClaims && 'x-hasura-provider-id' in hasuraJWTClaims) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  isPlayer(): boolean {
    if (!this.checkCareplanAndProviderInJWT()) {
      return true;
    }
    return false;
  }
}
