import { Injectable } from '@angular/core';
import { gql } from 'graphql-request';
import { environment } from 'src/environments/environment';
import { GqlClientService } from '../gql-client/gql-client.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor(
    private client: GqlClientService
  ) { }

  async new() {
    return this.client.req(gql`mutation StartSession($careplan:uuid!, $patient:uuid!) {
      insert_session_one(object: {careplan: $careplan, patient: $patient}) {
        id
      }
    }`, {
      careplan: environment.careplan,
      patient: environment.patient
    })
  }
}
