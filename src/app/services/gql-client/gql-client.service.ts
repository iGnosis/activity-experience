import { Injectable } from '@angular/core';
import { GraphQLClient } from 'graphql-request';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GqlClientService {
  private client: GraphQLClient;

  constructor() {
    const token = localStorage.getItem('token');
    this.client = new GraphQLClient(environment.endpoint, {
      headers: {
        authorization: 'Bearer ' + token,
      },
    });
  }

  refreshClient(jwt?: string) {
    const token = jwt || localStorage.getItem('token');
    this.client = new GraphQLClient(environment.endpoint, {
      headers: {
        authorization: 'Bearer ' + token,
      },
    });
  }

  async req(request: string, variables?: any) {
    return this.client.request(request, variables);
  }
}
