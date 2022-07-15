import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PromptService } from 'src/app/services/elements/prompt/prompt.service';
import { PromptElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss'],
  animations: [
    trigger('align-prompt', [
      state('start', style({ left: '50%', top: '50%' })),
      state('end', style({ left: '75%', top: '85%' })),
      transition('start => end', animate('0.5s')),
    ]),
  ],
})
export class PromptComponent implements OnInit, OnDestroy {
  state: PromptElementState;
  subscription: Subscription;
  promptAnimationState: string;
  promptAnimationTimeout: number;

  constructor(private promptService: PromptService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.promptAnimationState = 'start';

    // start animation after 1.5 second.
    this.promptAnimationTimeout = 1200;

    this.subscription = this.promptService.subject.subscribe((results) => {
      console.log('PromptComponent:subscription:results:', results);
      this.state = results;
    });

    setTimeout(() => {
      this.promptAnimationState = 'end';
    }, this.promptAnimationTimeout);
  }
}
