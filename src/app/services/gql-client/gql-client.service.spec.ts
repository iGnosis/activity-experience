import { TestBed } from '@angular/core/testing';

import { GqlClientService } from './gql-client.service';

describe('GqlClientService', () => {
  let service: GqlClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GqlClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
