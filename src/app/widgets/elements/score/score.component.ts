import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { Subscription } from 'rxjs';
import { ScoreService } from 'src/app/services/elements/score/score.service';
import { ElementAttributes, ScoreElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-score',
  templateUrl: './score.component.html',
  styleUrls: ['./score.component.scss'],
  animations: [
    trigger('fadeTransition', [
      state('fadeOut', style({ opacity: 0 })),
      state('fadeIn', style({ opacity: 1 })),
      transition('* => fadeOut', animate('{{duration}}ms ease-in')),
      transition('* => fadeIn', animate('{{duration}}ms ease-in')),
    ]),
  ],
})
export class ScoreComponent implements OnInit, OnDestroy {
  state: { data: ScoreElementState; attributes: ElementAttributes };
  subscription: Subscription;
  animationState: 'fadeIn' | 'fadeOut' = 'fadeIn';

  constructor(private scoreService: ScoreService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.state = this.scoreService.state;
    this.subscription = this.scoreService.subject.subscribe((value) => {
      this.animateScore(value);
    });
  }
  animateScore(value: { data: ScoreElementState; attributes: ElementAttributes }) {
    this.animationState = 'fadeOut';
    setTimeout(() => {
      this.state = value;
      this.animationState = 'fadeIn';
    }, this.state.data.transitionDuration || 500);
  }
}
