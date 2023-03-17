import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state, sequence } from '@angular/animations';
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
    trigger('collectScore', [
      transition('* => *', [
        style({
          opacity: 0,
          transform: 'translateY(100%)',
          top: '{{ top }}',
          left: '{{ left }}',
        }),
        sequence([
          animate(
            '200ms ease-out',
            style({
              opacity: 1,
              transform: 'translateY(0)',
            }),
          ),
          animate(
            '500ms 400ms ease-in',
            style({
              opacity: 1,
              top: '3rem',
              left: '3rem',
            }),
          ),
          animate(
            '100ms ease-in',
            style({
              opacity: 0,
            }),
          ),
        ]),
      ]),
    ]),
  ],
})
export class ScoreComponent implements OnInit, OnDestroy {
  state: { data: ScoreElementState; attributes: ElementAttributes };
  subscription: Subscription;
  animationState: 'fadeIn' | 'fadeOut' = 'fadeIn';
  scoreGain: number;

  constructor(private scoreService: ScoreService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.state = { ...this.scoreService.state };
    this.subscription = this.scoreService.subject.subscribe((value) => {
      const { score, highScore, icon, position, showScoreGained, ...rest } = value.data;
      this.state = {
        data: {
          score: this.state.data.score,
          highScore: this.state.data.highScore,
          icon: this.state.data.icon,
          position: this.state.data.position,
          showScoreGained: this.state.data.showScoreGained,
          ...rest,
        },
        attributes: value.attributes,
      };

      if (value.data.highScore) {
        this.state.data.highScore = value.data.highScore;
      }

      if (value.data.icon) {
        this.state.data.icon = value.data.icon;
      }

      if (value.data.position) {
        this.state.data.position = value.data.position;
      }

      if (value.data.showScoreGained !== undefined) {
        this.state.data.showScoreGained = value.data.showScoreGained;
      }

      if (score !== this.state.data.score && score && this.state.data.score !== undefined) {
        this.scoreGain = score;
        setTimeout(() => {
          this.state.data.score = score;
        }, 1200);
      } else {
        this.state.data.score = score;
      }
    });
  }
}
