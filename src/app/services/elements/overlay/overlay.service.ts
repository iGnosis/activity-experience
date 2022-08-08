import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameElement } from 'src/app/types/game-element';
import { ElementAttributes, OverlayElementState } from 'src/app/types/pointmotion';
import { CalibrationService } from '../../calibration/calibration.service';

@Injectable({
  providedIn: 'root',
})
export class OverlayService extends GameElement<OverlayElementState, object> {
  constructor(calibrationService: CalibrationService) {
    super(calibrationService);
    this._subject = new Subject<{ data: OverlayElementState; attributes: ElementAttributes }>();
    this._state = {
      data: {
        cards: [
          {
            icon: '/assets/images/overlay_icons/Protect.jpg',
            message: 'Safety above all',
            tts: "Please make sure you're in a safe environment.",
          },
          {
            icon: '/assets/images/overlay_icons/T_Pose.jpg',
            message: 'Space to move',
            tts: "You'll need enough space to freely move.",
          },
          {
            icon: '/assets/images/overlay_icons/Waiting.jpg',
            message: 'Rest if you feel tired',
            tts: 'Take a break if you feel tired.',
          },
        ],
      },
      attributes: {},
    };
  }
}
