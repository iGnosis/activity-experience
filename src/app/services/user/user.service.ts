import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor() {}

  debug() {
    console.log('hello from user.service');
  }
}
