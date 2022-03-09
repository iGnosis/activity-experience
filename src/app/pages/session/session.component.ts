import { Component, OnInit } from '@angular/core';
import * as Phaser from 'phaser';
import { CalibrationScene } from 'src/app/scenes/calibration/calibration.scene';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {

  session?: Phaser.Game
  config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: {y: 200}
      },
    },
  }

  // DI the needed scenes
  constructor(private calibrationScene: CalibrationScene) { }

  ngOnInit(): void {
    this.config.scene = [this.calibrationScene]
    this.session = new Phaser.Game(this.config)
  }

}
