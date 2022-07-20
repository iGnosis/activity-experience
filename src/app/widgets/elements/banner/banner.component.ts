import { animate } from '@angular/animations';
import { ViewEncapsulation, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BannerService } from 'src/app/services/elements/banner/banner.service';
import { BannerButton, BannerElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BannerComponent implements OnInit, OnDestroy {
  state: BannerElementState;
  subscription: Subscription;
  attributes: ElementAttributes;
  progressBarWidth = 0;

  constructor(private bannerService: BannerService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.bannerService.subject.subscribe((results) => {
      console.log('BannerComponent:subscription:results:', results);
      this.state = results.data;
      this.attributes = results.attributes;

      this.state.buttons?.forEach((button) => {
        this.animateProgressBar(button.progressDurationMs || 3000);
      });
    });
  }

  animateProgressBar(duration: number) {
    const increaseWidthPerMs = duration / 100;

    const animationInterval = setInterval(() => {
      if (this.progressBarWidth >= 100) {
        clearInterval(animationInterval);
      } else {
        this.progressBarWidth += 1;
      }
    }, increaseWidthPerMs);
  }

  onButtonClick(button: BannerButton) {
    console.log('onButtonClick:button:', button);
  }
}
