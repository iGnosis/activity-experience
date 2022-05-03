import { Injectable } from '@angular/core';
import { GraphQLClient } from 'graphql-request'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GqlClientService {
  private client: GraphQLClient

  constructor() {
    this.client = new GraphQLClient(environment.endpoint, {
      headers: {
        authorization: 'Bearer ' + environment.token,
      },
    })
  }

  async req(request: string, variables?: any) {
    return this.client.request(request, variables)
  }
}
