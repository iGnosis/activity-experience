import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { GqlClientService } from '../gql-client/gql-client.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const gqlClientServiceSpy = jasmine.createSpyObj('GqlClientService', [
    'refreshClient',
    'setUserId',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: GqlClientService, useValue: gqlClientServiceSpy }],
    });
    service = TestBed.inject(UserService);
    localStorage.setItem('token', '');
    localStorage.setItem('patient', '');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should save token', () => {
    spyOn(service, 'setPatient');
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE5YmYxNDkyLWE4ZjYtNDNlMC05ZmYzLTVhYWJkZmU1NWQ2ZiIsImlhdCI6MTY2Nzg4NDI5NywiZXhwIjoxNjcwNDc2Mjk3LCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsicGF0aWVudCJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJwYXRpZW50IiwieC1oYXN1cmEtdXNlci1pZCI6IjE5YmYxNDkyLWE4ZjYtNDNlMC05ZmYzLTVhYWJkZmU1NWQ2ZiJ9fQ.MS-VCSvhdYDYKID2ZwybdGxVuUbDcQBLAb4I5jQH5pg';

    const result = service.handleToken({
      data: {
        type: 'token',
        token,
      },
    });

    expect(localStorage.getItem('token')).toEqual(token);
    expect(service.setPatient).toHaveBeenCalledWith(token);
    expect(gqlClientServiceSpy.refreshClient).toHaveBeenCalledWith(token);
    expect(result).toEqual(true);
  });

  it("should't save invalid token", () => {
    spyOn(service, 'setPatient');
    const token = 'test_token';

    const result = service.handleToken({
      data: {
        type: 'token',
        token,
      },
    });

    expect(localStorage.getItem('token')).toEqual('');
    expect(result).toEqual(false);
  });

  it("should't save empty token", () => {
    const token = '';

    const result = service.handleToken({
      data: {
        type: 'token',
        token,
      },
    });

    expect(localStorage.getItem('token')).toEqual('');
    expect(result).toEqual(false);

    localStorage.removeItem('token');
  });

  it('should set patient ID', () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjE5YmYxNDkyLWE4ZjYtNDNlMC05ZmYzLTVhYWJkZmU1NWQ2ZiIsImlhdCI6MTY2Nzg4NDI5NywiZXhwIjoxNjcwNDc2Mjk3LCJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsicGF0aWVudCJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJwYXRpZW50IiwieC1oYXN1cmEtdXNlci1pZCI6IjE5YmYxNDkyLWE4ZjYtNDNlMC05ZmYzLTVhYWJkZmU1NWQ2ZiJ9fQ.MS-VCSvhdYDYKID2ZwybdGxVuUbDcQBLAb4I5jQH5pg';

    service.setPatient(token);

    expect(localStorage.getItem('patient')).toEqual('19bf1492-a8f6-43e0-9ff3-5aabdfe55d6f');
  });

  it("should't set patient id when token is invalid", () => {
    const token = 'test_token';

    service.setPatient(token);

    expect(localStorage.getItem('patient')).toEqual('');
  });
});
