import { animate, state, style, transition, trigger } from '@angular/animations';
import { ViewEncapsulation, Component, OnDestroy, OnInit, ElementRef } from '@angular/core';
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
      transition(':enter', [
        style({ transform: 'scale(0.5) translate(-100%, -100%)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'translate(-50%, -50%)', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ transform: 'translate(-50%, -50%)', opacity: 1 }),
        animate(
          '0.6s ease-out',
          style({ transform: 'scale(0.5) translate(-100%, -100%)', opacity: 0 }),
        ),
      ]),
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

  constructor(private bannerService: BannerService, private elmRef: ElementRef) {}

  ngOnDestroy(): void {
    console.log('banner ngOnDestroy');
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.bannerService.subject.subscribe((results) => {
      console.log('BannerComponent:subscription:results:', results);
      this.state = results.data;
      this.attributes = results.attributes;

      this.bindActions();

      setTimeout(() => {
        this.bannerAnimationState = 'mid';
        setTimeout(() => {
          this.bannerAnimationState = 'end';
          setTimeout(() => {
            this.state.buttons?.forEach((button) => {
              if (!button.infiniteProgress) {
                this.animateProgressBar(button.progressDurationMs || 3000);
              }
            });
          }, 500);
        }, 100);
      }, 100);
    });
  }

  bindActions() {
    setTimeout(() => {
      if (this.state.customActions) {
        for (const id of Object.keys(this.state.customActions)) {
          this.bindMethod(id, this.state.customActions[id]);
        }
      }
    }, 200);
  }

  bindMethod(id: string, method: () => void) {
    this.elmRef.nativeElement.querySelector(`#${id}`).addEventListener('click', method.bind(this));
  }

  animateProgressBar(duration: number) {
    this.progressDuration = duration / 1000;
    this.progressBarAnimationState = 'progress';

    setTimeout(() => {
      this.bannerService.hide();
      this.bannerAnimationState = 'start';
      this.progressBarAnimationState = 'start';
    }, duration);
  }

  onButtonClick(button: BannerButton) {
    console.log('onButtonClick:button:', button);
  }
}
