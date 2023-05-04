import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ClinicalScoreService } from 'src/app/services/elements/clinical-score/clinical-score.service';
import { ClinialScoreElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-clinical-score',
  templateUrl: './clinical-score.component.html',
  styleUrls: ['./clinical-score.component.scss'],
  animations: [
    trigger('movePointer', [
      state(
        'start',
        style({
          left: '-8px',
        }),
      ),
      state(
        'end',
        style({
          left: '{{ pointerPosition }}px',
        }),
        {
          params: { pointerPosition: '-8' },
        },
      ),
      transition('start <=> end', animate('2.5s')),
    ]),
  ],
})
export class ClinicalScoreComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  state: ClinialScoreElementState;
  attributes: ElementAttributes;
  pointerPosition = -8;
  pointerAnimationState = 'start';

  constructor(private clinicalScoreService: ClinicalScoreService, private elmRef: ElementRef) {}

  ngOnDestroy(): void {
    console.log('clinical-score ngOnDestroy');
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.clinicalScoreService.subject.subscribe((results) => {
      console.log('ClinicalScoreComponent:subscription:results:', results);
      this.state = results.data;
      this.attributes = results.attributes;
      setTimeout(() => {
        if (this.state.scorePercentage) {
          this.pointerPosition = this.getPointerPosition(this.state.scorePercentage);
          this.pointerAnimationState = 'end';
        }
      }, 500);
    });
  }

  getPointerPosition(score: number) {
    const barWidth = this.elmRef.nativeElement.querySelector('.bar').offsetWidth;
    const barPointerWidth = this.elmRef.nativeElement.querySelector('.bar-pointer').offsetWidth;
    console.log('setPointerPosition:barWidth', barWidth);
    console.log('setPointerPosition:barPointerWidth', barPointerWidth);

    const maxPointerPosition = barWidth - barPointerWidth;
    const pointerPositionPercentage = score / 100;
    return maxPointerPosition * pointerPositionPercentage;
  }
}
