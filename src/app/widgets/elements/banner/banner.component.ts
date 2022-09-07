import { animate, state, style, transition, trigger } from '@angular/animations';
import { ViewEncapsulation, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BannerService } from 'src/app/services/elements/banner/banner.service';
import { BannerButton, BannerElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('animate-banner', [
      state('start', style({ width: '300px', height: '200px', opacity: 0.0 })),
      state('mid', style({ width: '450px', height: '300px', opacity: 0.5 })),
      state('end', style({ opacity: 1 })),
      transition('start => mid', animate('0.3s ease-out')),
      transition('mid => end', animate('0.3s ease-out')),
    ]),
    trigger('animate-progress-bar', [
      state('start', style({ width: 0 })),
      state('progress', style({ width: '100%' })),
      transition('start => progress', animate('{{duration}}s')),
    ]),
  ],
})
export class BannerComponent implements OnInit, OnDestroy {
  state: BannerElementState;
  subscription: Subscription;
  attributes: ElementAttributes;
  progressBarWidth = 0;
  bannerAnimationState = 'start';
  progressBarAnimationState: 'start' | 'progress' = 'start';
  progressDuration: number;

  constructor(private bannerService: BannerService) {}

  ngOnDestroy(): void {
    console.log('banner ngOnDestroy');
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.bannerService.subject.subscribe((results) => {
      console.log('BannerComponent:subscription:results:', results);
      this.state = results.data;
      this.attributes = results.attributes;

      setTimeout(() => {
        this.bannerAnimationState = 'mid';
        setTimeout(() => {
          this.bannerAnimationState = 'end';
          setTimeout(() => {
            this.state.buttons?.forEach((button) => {
              this.animateProgressBar(button.progressDurationMs || 3000);
            });
          }, 500);
        }, 100);
      }, 100);
    });
  }

  animateProgressBar(duration: number) {
    this.progressDuration = duration / 1000;
    this.progressBarAnimationState = 'progress';

    setTimeout(() => {
      this.bannerService.hide();
      this.bannerAnimationState = 'start';
      this.progressBarAnimationState = 'start';
    }, duration + 500);
  }

  onButtonClick(button: BannerButton) {
    console.log('onButtonClick:button:', button);
  }
}
