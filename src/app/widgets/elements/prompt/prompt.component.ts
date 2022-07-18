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
      state('start', style({ height: '250px', width: '250px', 'line-height': '250px' })),
      state('open', style({ left: '50%', right: '50%' })),
      state('exit', style({ left: '85%' })),
      transition('start => open', animate('0.5s ease-in')),
      transition('open => exit', animate('1s ease-in')),
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
    this.subscription = this.promptService.subject.subscribe((results) => {
      console.log('PromptComponent:subscription:results:', results);
      this.state = results;
    });

    this.promptAnimationState = 'start';
    this.promptAnimationTimeout = 100;

    setTimeout(() => {
      this.promptAnimationState = 'open';
      setTimeout(() => {
        this.promptAnimationState = 'exit';
      }, 1000);
    }, this.promptAnimationTimeout);

  }
}
