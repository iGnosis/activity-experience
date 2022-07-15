import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PromptService } from 'src/app/services/elements/prompt/prompt.service';
import { PromptElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss'],
  animations: [],
})
export class PromptComponent implements OnInit, OnDestroy {
  state: PromptElementState;
  subscription: Subscription;

  constructor(private promptService: PromptService) { }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.promptService.subject.subscribe((results) => {
      console.log('PromptComponent:subscription:results:', results);
      this.state = results;
    });
  }
}
