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

  /**
   * Recreate the client with the new jwt token
   *
   * @param {string} jwt?
   * @returns {void}
   */
  refreshClient(jwt?: string) {
    const token = jwt || localStorage.getItem('token');
    this.client = new GraphQLClient(environment.endpoint, {
      headers: {
        authorization: 'Bearer ' + token,
      },
    });
  }

  /**
   * Used to make a query to the graphql server
   *
   * @param {string} request
   * @param {{ [key: string]: any } | undefined} variables?
   * @returns {Promise<any>}
   */
  async req(request: string, variables?: { [key: string]: any }): Promise<any> {
    return this.client.request(request, variables);
  }
}
