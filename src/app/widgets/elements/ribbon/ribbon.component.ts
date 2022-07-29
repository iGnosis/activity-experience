import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { RibbonService } from 'src/app/services/elements/ribbon/ribbon.service';
import { Subscription } from 'rxjs';
import { ElementAttributes, RibbonElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-ribbon',
  templateUrl: './ribbon.component.html',
  styleUrls: ['./ribbon.component.scss'],
  animations: [
    trigger('textSlideIn', [
      state('enter', style({ transform: 'translateX(-100vw)' })),
      state('open', style({ transform: 'translateX(0%)' })),
      state('exit', style({ transform: 'translateX(100vw)' })),
      transition('enter => open', animate('{{duration}}ms ease-in')),
      transition('open => exit', animate('{{duration}}ms ease-in')),
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
  state: { data: RibbonElementState; attributes: ElementAttributes };
  title: string;
  bgAnimationState: 'open' | 'enter' | 'exit' = 'enter';
  textAnimationState: 'open' | 'enter' | 'exit' = 'enter';
  subscription: Subscription;
  to: any;
  constructor(private ribbonService: RibbonService) {}
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.ribbonService.subject.subscribe((value) => {
      this.state = value;
      console.log('next periodical:');
      this.textAnimationState = 'enter';
      this.bgAnimationState = 'enter';
      this.showTitles();
    });
  }
  showTitles() {
    const { data } = this.state;
    if (!Array.isArray(data.titles) || data.titles.length === 0) return;
    let i = -1;
    this.bgAnimationState = 'open';
    const periodical = async () => {
      this.to = setTimeout(
        () => {
          if (this.textAnimationState === 'open') {
            this.textAnimationState = 'exit';
          } else if (this.textAnimationState === 'exit') {
            this.textAnimationState = 'enter';
          } else if (Array.isArray(data.titles)) {
            if (data.titles && i === data.titles.length - 1) {
              this.bgAnimationState = 'exit';
              this.to = null;
              return;
            }
            this.title = data.titles[++i];
            this.textAnimationState = 'open';
          }
          periodical();
        },
        this.textAnimationState === 'open'
          ? data.titleDuration || 2000
          : data.transitionDuration
          ? data.transitionDuration
          : 200,
      );
    };
    periodical();
  }
}
