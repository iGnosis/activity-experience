import { Injectable } from '@angular/core';
import { UserService } from 'src/app/services/user/user.service';

@Injectable({
  providedIn: 'root'
})
export class CalibrationScene extends Phaser.Scene {

  constructor(private userService: UserService) {
    super({key: 'calibration'})
    console.log(this.userService);
  }

  preload() {
    console.log(this.userService.debug())
    
  }
}
