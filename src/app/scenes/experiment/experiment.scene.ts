import { Injectable } from '@angular/core';
import { Results } from '@mediapipe/holistic';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CalibrationService } from 'src/app/services/calibration/calibration.service';
import { SessionRow } from 'src/app/types/pointmotion';
import { CalibrationScene } from '../calibration/calibration.scene';

@Injectable({
  providedIn: 'root',
})
export class ExperimentScene extends Phaser.Scene {
  leftRect!: Phaser.GameObjects.Rectangle;
  rightRect!: Phaser.GameObjects.Rectangle;
  pose!: Results;
  ball!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
  observables$: {
    pose: Observable<{ pose: Results }>;
    session: Observable<SessionRow | undefined>;
  };
  calibrationStatus: 'success' | 'error' | 'warning' = 'error';
  text!: Phaser.GameObjects.Text;
  collisionCount = 0;
  leftHandSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  rightHandSprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

  constructor(
    private store: Store<{ pose: any }>,
    private calibrationScene: CalibrationScene,
    private calibrationService: CalibrationService,
  ) {
    super({ key: 'experiment' });
  }

  preload() {
    this.load.svg('red_ball', 'assets/images/ball_red.svg');
  }
  create() {
    const { width, height } = this.game.canvas;

    this.text = this.add.text(20, 20, '', {
      font: '60px Courier',
      color: '#00ff00',
    });
    this.text.setText(this.collisionCount.toString());

    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.setBoundsCollision(true, true, true, true);
    this.ball = this.physics.add.sprite(390, 0, 'red_ball').setScale(2, 2).setOrigin(0, 0);
    console.log(this.ball.width);
    this.ball.setCircle(this.ball.width / 2);
    this.ball.setFriction(0, 0);
    this.ball.setVelocity(80, 80);
    this.ball.setGravityY(200);
    this.ball.setCollideWorldBounds(true, 1, 1);

    // if (this.leftHand && this.ball) {
    // this.physics.add.overlap(
    //   this.leftRect,
    //   this.ball,
    //   (e) => {
    //     console.log(e);
    //     this.collisionCount += 1;
    //     console.log(this.collisionCount);
    //     this.text.setText(this.collisionCount.toString());
    //   },
    //   undefined,
    //   this,
    // );
    // }

    // if (this.rightHand && this.ball) {
    // this.physics.add.overlap(
    //   this.rightRect,
    //   this.ball,
    //   (e) => {
    //     console.log(e);
    //     this.collisionCount += 1;
    //     console.log(this.collisionCount);
    //     this.text.setText(this.collisionCount.toString());
    //   },
    //   undefined,
    //   this,
    // );
    // }
  }
  override update(time: number, delta: number): void {
    const { height, width } = this.game.canvas;
    // this.text.setText(this.collisionCount.toString());
    // this.destroyGraphics();
    // if (this.pose) {
    //   this.drawRects(this.pose);
    // }

    if (this.ball && this.ball.x >= 1100) {
      if (this.ball.active) {
        this.ball.destroy(true);
      }
    }

    if (!this.ball.active) {
      this.ball = this.physics.add.sprite(400, 0, 'red_ball').setScale(2, 2);
      this.ball.setFriction(0, 0);
      this.ball.setVelocity(80, 80);
      this.ball.setGravityY(200);
      this.ball.setCollideWorldBounds(true, 1, 1);
    }
  }

  start() {
    this.startExperimentScene();
    this.subscribe();
    this.calibrationScene.drawCalibrationBox('error');
    this.calibrationService.enable();
  }

  startCalibrationScene() {
    if (this.game?.scene.isActive('experiment')) {
      this.game.scene.stop('experiment');
      console.log('sit2stand is active. turning off');
      this.game?.scene.start('calibration');
      console.log('start calibration');
    } else {
      console.log('calibration is already active');
    }
  }

  startExperimentScene() {
    if (this.scene) {
      if (this.game.scene.isActive('calibration')) {
        this.game.scene.stop('calibration');
        this.game.scene.start('experiment');
      }
    }
  }

  subscribe() {
    this.observables$ = this.observables$ || {};
    this.observables$.pose = this.store.select((state) => state.pose);
    this.observables$.pose.subscribe((results: { pose: Results }) => {
      if (results) {
        this.pose = results.pose;
        this.handlePose(results);
        this.destroyGraphics();
        this.drawRects(this.pose);
      }
    });
  }

  handlePose(results: { pose: Results }) {
    const calibrationResult = this.calibrationService.handlePose(results);
    if (calibrationResult && this.calibrationStatus !== calibrationResult.status) {
      console.log(calibrationResult);
      this.handleCalibrationResult(calibrationResult.status);
      this.calibrationStatus = calibrationResult.status;
    }
  }

  handleCalibrationResult(calibrationResult: 'success' | 'error' | 'warning') {
    console.log('calibration Result', calibrationResult);
    switch (calibrationResult) {
      case 'warning':
        this.handleCalibrationWarning('warning');
        break;
      case 'success':
        this.handleCalibrationSuccess('success');
        break;
      case 'error':
        this.handleCalibrationError('error');
        break;
      default:
    }
  }
  handleCalibrationWarning(warning: string) {
    this.calibrationScene.drawCalibrationBox(warning);
  }
  handleCalibrationSuccess(success: string) {
    this.startExperimentScene();
  }
  handleCalibrationError(error: string) {
    this.calibrationScene.drawCalibrationBox(error);
    this.startCalibrationScene();
  }

  destroyGraphics() {
    if (this.leftHand) {
      this.leftHand.destroy();
    }
    if (this.leftHandSprite) {
      this.leftHandSprite.destroy();
    }
    if (this.rightHand) {
      this.rightHand.destroy();
    }
  }

  leftHand?: Phaser.GameObjects.Graphics = undefined;
  rightHand?: Phaser.GameObjects.Graphics = undefined;

  drawRects(poseResults: Results) {
    const { width, height } = this.game.canvas;
    const rightElbow = poseResults.poseLandmarks[14];
    const leftElbow = poseResults.poseLandmarks[13];
    const rightWrist = poseResults.poseLandmarks[16];
    const leftWrist = poseResults.poseLandmarks[15];

    if (this.leftRect) {
      this.leftRect.destroy(true);
    }

    if (this.rightRect) {
      this.rightRect.destroy(true);
    }

    if (!rightElbow || !leftElbow || !rightWrist || !leftWrist) {
      return;
    }

    const leftRectAngle =
      Math.atan2(
        leftWrist.y * height - leftElbow.y * height,
        leftWrist.x * width - leftElbow.x * width,
      ) *
      (180 / Math.PI);

    const rightRectAngle =
      Math.atan2(
        rightWrist.y * height - rightElbow.y * height,
        rightWrist.x * width - rightElbow.x * width,
      ) *
      (180 / Math.PI);
    console.log(`left ${leftRectAngle} right ${rightRectAngle}`);

    // ! method - 1
    // this.leftRect = new Phaser.GameObjects.Rectangle(
    //   this,
    //   width - leftElbow.x * width,
    //   leftElbow.y * height,
    //   20,
    //   40,
    //   0xffffff,
    //   1,
    // ).setAngle(leftRectAngle);

    // this.physics.add.existing(this.leftRect);

    // this.rightRect = new Phaser.GameObjects.Rectangle(
    //   this,
    //   width - rightElbow.x * width,
    //   rightElbow.y * height,
    //   20,
    //   40,
    //   0xffffff,
    //   1,
    // ).setAngle(rightRectAngle);

    // this.physics.add.existing(this.rightRect);

    // ! method - 2
    this.leftHand = this.add.graphics().setInteractive();
    this.leftHand!.lineStyle(20, 0xff0000, 0.3);
    this.leftHand!.lineBetween(
      width - leftElbow.x * width,
      leftElbow.y * height,
      width - leftWrist.x * width,
      leftWrist.y * height,
    );
    this.physics.add.existing(this.leftHand);

    if (this.leftHand) {
      this.leftHand?.generateTexture(
        'left-hand',
        (this.leftHand as any).body.width,
        (this.leftHand as any).body.height,
      );
      this.leftHandSprite = this.physics.add
        .sprite(width - leftElbow.x * width, leftElbow.y * height, 'left-hand')
        .setOrigin(0.5)
        .setAlpha(0.3)
        .setInteractive();
    }
    if (this.ball && this.leftHandSprite) {
      this.physics.world.overlap(
        this.ball,
        [this.leftHandSprite],
        () => {
          this.text.setText((++this.collisionCount).toString());
          this.ball.destroy();
        },
        undefined,
        null,
      );
    }

    // if(this.physics.overlap) {
    //   alert('overllaped left');
    // }

    // this.physics.world.enable(this.leftHand);

    // this.rightHand = new Phaser.GameObjects.Graphics(this);
    // this.rightHand!.lineStyle(20, 0xff0000, 0.3);
    // this.rightHand!.lineBetween(
    //   width - rightElbow.x * width,
    //   rightElbow.y * height,
    //   width - rightWrist.x * width,
    //   rightWrist.y * height,
    // );
    // if (this.rightHand) {
    //   this.rightHand?.generateTexture('right-hand');
    //   this.rightHandSprite = this.physics.add
    //     .sprite(0, 0, 'right-hand')
    //     .setOrigin(0.5)
    //     .setAlpha(0.3)
    //     .setInteractive()
    //     .setCollideWorldBounds(true, 1, 1)
    //     .setImmovable();
    // }
    // this.physics.world.enable(this.rightHand);
    // this.rightHand.setInteractive();
    // this.physics.add.existing(this.rightHand);

    // ! method - 3
    // this.graphics = this.add.graphics({ fillStyle: { color: 0xffff00, alpha: 1 } });
    // this.graphics!.lineStyle(20, 0xffff00);
    // const left = new Phaser.Geom.Rectangle(
    //   width - leftElbow.x,
    //   leftElbow.y,
    //   10,
    //   height - leftElbow.y - leftWrist.y,
    // );
    // this.graphics!.strokeRectShape(left);
  }
}
