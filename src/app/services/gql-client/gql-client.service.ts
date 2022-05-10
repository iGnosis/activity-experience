import { Injectable } from '@angular/core';
import { GraphQLClient } from 'graphql-request';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GqlClientService {
  private client: GraphQLClient;

  constructor() {
    // const token = localStorage.getItem('token')
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiJBbWFuIiwibGFzdE5hbWUiOiJHYXV0YW0iLCJpZCI6ImQ4NWUyMzE1LTI0ZDItNDU5My04NmZmLWY5NzAwYzJlNmFjNCIsInByb3ZpZGVyIjoiMjBlNjYxMzItZDViNC00YTczLWI0NTgtZGQxOTI2NWQ2ZGJhIiwiaHR0cHM6Ly9oYXN1cmEuaW8vand0L2NsYWltcyI6eyJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbInBhdGllbnQiLCJ0aGVyYXBpc3QiLCJhZG1pbiJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ0aGVyYXBpc3QiLCJ4LWhhc3VyYS11c2VyLWlkIjoiZDg1ZTIzMTUtMjRkMi00NTkzLTg2ZmYtZjk3MDBjMmU2YWM0IiwieC1oYXN1cmEtcHJvdmlkZXItaWQiOiIyMGU2NjEzMi1kNWI0LTRhNzMtYjQ1OC1kZDE5MjY1ZDZkYmEifSwiaWF0IjoxNjUxODM2NDc2fQ.VlqYkiljOKssDXAj7Jt2f7whdTUiUuauVnU06YsqB3s'
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
