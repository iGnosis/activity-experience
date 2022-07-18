import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { OverlayService } from 'src/app/services/elements/overlay/overlay.service';
import { ElementAttributes, OverlayElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent implements OnInit, OnDestroy {
  state: { data: OverlayElementState; attributes: object & ElementAttributes };
  subscription: Subscription;
  cardCount = 0;

  constructor(private overlayService: OverlayService) {}
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.overlayService.subject.pipe(take(1)).subscribe((value) => {
      this.state = value;

      if (Array.isArray(this.state.data.cards) && this.state.data.cards.length > 0) {
        this.showCards();
      }
    });
  }
  showCards() {
    const interval = setInterval(() => {
      if (this.cardCount >= this.state.data.cards.length) {
        this.overlayService.hide();
        this.overlayService.subject.next(this.state);
        this.cardCount = 0;
        clearInterval(interval);
        return;
      }
      ++this.cardCount;
    }, this.state.data.transitionDuration || 1000);
  }
}
