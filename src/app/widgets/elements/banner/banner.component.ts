import { ViewEncapsulation, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BannerService } from 'src/app/services/elements/banner/banner.service';
import { BannerElementState, ElementAttributes } from 'src/app/types/pointmotion';

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

  constructor(private bannerService: BannerService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.bannerService.subject.subscribe((results) => {
      console.log('BannerComponent:subscription:results:', results);
      this.state = results.data;
      this.attributes = results.attributes;
    });
  }
}
