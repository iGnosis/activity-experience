import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameMenuService } from 'src/app/services/elements/game-menu/game-menu.service';
import {
  ElementAttributes,
  GameMenuElementState,
  HandTrackerStatus,
} from 'src/app/types/pointmotion';

@Component({
  selector: 'element-game-menu',
  templateUrl: './game-menu.component.html',
  styleUrls: ['./game-menu.component.scss'],
  animations: [
    trigger('slideFromBottom', [
      state('visible', style({ transform: 'translateY(0%)' })),
      state('hidden', style({ transform: 'translateY(300%)' })),
      transition('* => visible', [animate('300ms ease-out')]),
      transition(':leave', [animate('300ms ease-out', style({ transform: 'translateY(300%)' }))]),
    ]),
    trigger('borderWipe', [
      transition('*=>hold', [
        style({
          clipPath: 'polygon(50% 50%, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0)',
          opacity: 1,
        }),
        animate(
          '{{duration}}ms ease-out',
          keyframes([
            style({
              clipPath: 'polygon(50% 50%, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0)',
              offset: 0,
            }),
            style({
              clipPath: 'polygon(50% 50%, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0)',
              offset: 0.16,
            }),
            style({
              clipPath: 'polygon(50% 50%, 0 0, 0 0, 0 0, 0 0, 0 0, 50% 0)',
              offset: 0.33,
            }),
            style({
              clipPath: 'polygon(50% 50%, 0 100%, 0 100%, 0 100%, 0 100%, 0 0, 50% 0)',
              offset: 0.5,
            }),
            style({
              clipPath: 'polygon(50% 50%, 100% 100%, 100% 100%, 100% 100%, 0 100%, 0 0, 50% 0)',
              offset: 0.66,
            }),
            style({
              clipPath: 'polygon(50% 50%, 100% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)',
              offset: 0.83,
            }),
            style({
              clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0, 50% 0)',
              offset: 1,
            }),
          ]),
        ),
      ]),
      transition('hold=>stop', [
        style({
          clipPath: 'polygon(50% 50%, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0, 50% 0)',
          opacity: 0,
        }),
      ]),
    ]),
  ],
})
export class GameMenuComponent implements OnInit {
  state: { data: GameMenuElementState; attributes: ElementAttributes };
  subscription: Subscription;

  leftBorderAnimState: '' | 'hold' | 'stop' = '';
  rightBorderAnimState: '' | 'hold' | 'stop' = '';
  exitTimeout: any;
  choiceTimeout: any;

  constructor(private gameMenuService: GameMenuService) {}

  ngOnInit(): void {
    let prevState: any;
    this.subscription = this.gameMenuService.subject.subscribe((value) => {
      this.state = { ...this.state, ...value };
      this.updateGesture(this.state.data.gesture);
      this.handleExitTimeout(value, prevState);
      prevState = value;
    });
  }

  handleExitTimeout(currentState = this.state, prevState?: any) {
    const isJustVisible =
      prevState?.attributes?.visibility !== currentState.attributes.visibility &&
      currentState.attributes.visibility === 'visible';
    if (isJustVisible) {
      if (typeof this.state.data.timeoutDuration === 'undefined') return;
      this.exitTimeout = setTimeout(() => {
        this.state.data.onLeft && this.state.data.onLeft();
      }, this.state.data.timeoutDuration || 15_000);
    } else if (currentState.attributes.visibility === 'hidden') {
      clearTimeout(this.exitTimeout);
    }
  }

  updateGesture(gesture: HandTrackerStatus) {
    if (gesture === 'left-hand') {
      this.leftBorderAnimState = 'hold';
      this.rightBorderAnimState = 'stop';
      clearTimeout(this.choiceTimeout);
      this.choiceTimeout = setTimeout(() => {
        this.state.data.onLeft && this.state.data.onLeft();
      }, this.state.data.holdDuration || 2000);
    } else if (gesture === 'right-hand') {
      this.leftBorderAnimState = 'stop';
      this.rightBorderAnimState = 'hold';
      clearTimeout(this.choiceTimeout);
      this.choiceTimeout = setTimeout(() => {
        this.state.data.onRight && this.state.data.onRight();
      }, this.state.data.holdDuration || 2000);
    } else if (gesture === 'both-hands') {
      this.leftBorderAnimState = 'hold';
      this.rightBorderAnimState = 'hold';
    } else {
      this.leftBorderAnimState = 'stop';
      this.rightBorderAnimState = 'stop';
      clearTimeout(this.choiceTimeout);
    }
  }
}
