/* eslint-disable @typescript-eslint/ban-ts-comment */
import { TestBed } from '@angular/core/testing';
import { GraphQLClient } from 'graphql-request';

import { GqlClientService } from './gql-client.service';

describe('GqlClientService', () => {
  let service: GqlClientService;
  let client: GraphQLClient;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GqlClientService);

    // @ts-ignore
    client = service.client;
    spyOn(client, 'request').and.returnValue(Promise.resolve({ status: 'success' }));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send GQL request', (done) => {
    const query = `query {
      user {
        id
        name
      }
    }`;

    service.req(query).then((res) => {
      expect(res.status).toBe('success');
      done();
    });
  });

  it('should send GQL request with params', (done) => {
    const query = `query {
      user {
        id
        name
      }
    }`;
    const params = { id: 1 };

    service.req(query, params).then((res) => {
      expect(res.status).toBe('success');
      done();
    });
  });

  it('should refresh GQL client', () => {
    const clientOld = client;

    service.refreshClient('newToken');

    // @ts-ignore
    const clientNew = service.client;

    expect(clientOld).not.toBe(clientNew);
  });

  it("shouldn't refresh GQL client if token is empty", () => {
    const clientOld = client;

    service.refreshClient('');

    // @ts-ignore
    const clientNew = service.client;

    expect(clientOld).toBe(clientNew);
  });
});
