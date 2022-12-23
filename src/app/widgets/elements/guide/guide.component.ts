import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GuideService } from 'src/app/services/elements/guide/guide.service';
import { ElementAttributes, GuideElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss'],
})
export class GuideComponent implements OnInit, OnDestroy {
  state: { data: GuideElementState; attributes: object & ElementAttributes };
  subscription: Subscription;
  logoUrl = '/assets/images/sound_health_logo.jpg';

  constructor(private guideService: GuideService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.guideService.subject.subscribe((value) => {
      this.state = value;
      this.hideTitle();
    });
  }
  hideTitle() {
    if (this.state.data.title && !this.state.data.showIndefinitely) {
      setTimeout(() => {
        this.state.data = {
          ...this.state.data,
          title: '',
        };
      }, this.state.data.titleDuration || 1000);
    }
  }
}
