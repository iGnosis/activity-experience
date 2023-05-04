import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TitleBarService } from 'src/app/services/elements/title-bar/title-bar.service';
import { ElementAttributes, TitleBarElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-title-bar',
  templateUrl: './title-bar.component.html',
  styleUrls: ['./title-bar.component.scss'],
  animations: [
    trigger('slideIn', [
      state('top', style({ transform: 'translate(-50%, 0%)' })),
      state('bottom', style({ transform: 'translate(-50%, 100%)' })),
      transition('top => bottom', [
        style({ transform: 'translate(-50%, 0%)' }),
        animate('200ms ease-in', style({ transform: 'translate(-50%, -200%)', opacity: 0 })),
        style({ transform: 'translate(-50%, 250%)' }),
        animate('200ms ease-out', style({ transform: 'translate(-50%, 100%)', opacity: 1 })),
      ]),
      transition('hidden => top', [
        style({ transform: 'translate(-50%, -100%)' }),
        animate('300ms ease-out', style({ transform: 'translate(-50%, 0%)' })),
      ]),
      transition('hidden => bottom', [
        style({ transform: 'translate(-50%, 100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translate(-50%, 0%)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class TitleBarComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  data: TitleBarElementState;
  attributes: ElementAttributes;
  transitionState: 'hidden' | 'top' | 'bottom' = 'hidden';

  constructor(private titleBarService: TitleBarService) {}

  ngOnInit(): void {
    this.subscription = this.titleBarService.subject.subscribe(async (state) => {
      if (state.attributes.visibility === 'visible') {
        const fromTopToBottom =
          this.transitionState === 'top' && state.data.transitionFrom === 'bottom';
        if (fromTopToBottom) {
          this.transitionState = state.data.transitionFrom || 'top';
          await new Promise((resolve) => setTimeout(resolve, 150));
        } else {
          this.transitionState = state.data.transitionFrom || 'top';
        }
      } else {
        this.transitionState = 'hidden';
      }
      console.log('changed state, ', this.transitionState);
      this.data = state.data;
      this.attributes = state.attributes;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
