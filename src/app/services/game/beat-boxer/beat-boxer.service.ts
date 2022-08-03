import { Injectable } from '@angular/core';
import { BeatBoxerScene } from 'src/app/scenes/beat-boxer/beat-boxer.scene';
import { ActivityBase } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { CalibrationService } from '../../calibration/calibration.service';
import { ElementsService } from '../../elements/elements.service';
import { TtsService } from '../../tts/tts.service';

@Injectable({
  providedIn: 'root',
})
export class BeatBoxerService implements ActivityBase {
  private config = {
    minCorrectReps: environment.settings['beat_boxer'].configuration.minCorrectReps,
    speed: environment.settings['beat_boxer'].configuration.speed,
  };
  constructor(
    private beatBoxerScene: BeatBoxerScene,
    private elements: ElementsService,
    private calibrationService: CalibrationService,
    private ttsService: TtsService,
  ) {
    // methods to enable the scene, overlays, collision
    this.beatBoxerScene.enable();
    this.beatBoxerScene.enableLeftHand();
    this.beatBoxerScene.enableRightHand();
    this.beatBoxerScene.enableCollisionDetection();

    // this callback will trigger on every collision
    this.beatBoxerScene.setUpCallbacks({
      onCollision: (collision) => {
        console.log('collision Result', collision);
      },
    });
  }
  welcome() {
    return [
      async (reCalibrationCount: number) => {
        this.beatBoxerScene.scene.start('beatBoxer');

        // await this.elements.sleep(3000);
        // this.elements.ribbon.state = {
        //   data: {
        //     titles: ['Next Activity', 'Beat Boxer'],
        //     transitionDuration: 1000,
        //   },
        //   attributes: {
        //     visibility: 'visible',
        //     reCalibrationCount,
        //   },
        // };

        // this.ttsService.tts('Starting next activity... Beat boxer');
      },
    ];
  }
  tutorial() {
    return [
      async (reCalibrationCount: number) => {
        // just in case if user calibrates and uncalibrates.. this will remove exisiting bags on the scene.
        this.beatBoxerScene.destroyExistingBags();

        console.log('drawing boxing bags..');
        this.beatBoxerScene.showBag('top-left', 'heavy-blue');

        // if timeout is provided, it will wait until the timeout or else it will wait indefinitely.
        const collision = await this.beatBoxerScene.waitForCollisionOrTimeout();
        console.log('Collision data::', collision);

        this.beatBoxerScene.showObstacle('top-right', 'obstacle-top');
        await this.beatBoxerScene.waitForCollisionOrTimeout(6000);

        this.beatBoxerScene.showBag('top-left', 'speed-red');
        await this.beatBoxerScene.waitForCollisionOrTimeout();
      },
    ];
  }
  loop() {
    return [async () => {}];
  }
  preLoop() {
    return [];
  }
  postLoop() {
    return [];
  }
}
