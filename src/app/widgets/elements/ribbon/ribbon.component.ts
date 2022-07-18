import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { RibbonService } from 'src/app/services/elements/ribbon/ribbon.service';
import { RibbonElementState } from 'src/app/types/pointmotion';
import { Subscription } from 'rxjs';

@Component({
  selector: 'element-ribbon',
  templateUrl: './ribbon.component.html',
  styleUrls: ['./ribbon.component.scss'],
  animations: [
    trigger('textSlideIn', [
      state('enter', style({ transform: 'translateX(-100vw)' })),
      state('open', style({ transform: 'translateX(0%)' })),
      state('exit', style({ transform: 'translateX(100vw)' })),
      transition('enter => open', animate('0.4s ease-in')),
      transition('* => exit', animate('0.4s ease-in')),
    ]),
    trigger('bgFadeIn', [
      state('enter', style({ transform: 'translateY(-50%) scale(0.3)', opacity: 0 })),
      state('open', style({ transform: 'translateY(-50%) scale(1)', opacity: 1 })),
      state('exit', style({ transform: 'translateY(-50%) scale(0.3)', opacity: 0 })),
      transition('* => open', animate('0.2s ease-in')),
      transition('* => exit', animate('0.2s ease-in')),
    ]),
  ],
})
export class RibbonComponent implements OnInit, OnDestroy {
  state: RibbonElementState;
  title: string;
  subscription: Subscription;
  bgAnimationState: 'open' | 'enter' | 'exit' = 'enter';
  textAnimationState: 'open' | 'enter' | 'exit' = 'enter';
  constructor(private ribbonService: RibbonService) {}
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.ribbonService.subject.subscribe((value) => {
      this.state = value;
      this.showTitles();
    });
  }
  showTitles() {
    if (!Array.isArray(this.state.titles) || this.state.titles.length === 0) return;

    let i = 0;
    this.bgAnimationState = 'open';
    this.textAnimationState = 'enter';
    const int = setInterval(async () => {
      if (this.textAnimationState === 'open') {
        this.textAnimationState = 'exit';
      } else if (this.textAnimationState === 'exit') {
        this.textAnimationState = 'enter';
      } else {
        if (i === this.state.titles.length) {
          this.bgAnimationState = 'exit';
          clearInterval(int);
        }
        this.title = this.state.titles[i++];
        this.textAnimationState = 'open';
      }
    }, this.state.transitionDuration || 500);
  }
}
