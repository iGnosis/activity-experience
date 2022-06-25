import { Injectable } from '@angular/core';
import { GqlClientService } from '../gql-client/gql-client.service';

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
      this.gqlClientService.refreshClient(data.data.token);
      return true;
    } else {
      return false;
    }
  }
}
