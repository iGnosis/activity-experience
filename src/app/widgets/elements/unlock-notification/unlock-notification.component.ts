import { animate, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UnlockNotificationService } from 'src/app/services/elements/unlock-notification/unlock-notification.service';
import { ElementAttributes, UnlockNotificationElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-unlock-notification',
  templateUrl: './unlock-notification.component.html',
  styleUrls: ['./unlock-notification.component.scss'],
  animations: [
    trigger('slideLeft', [
      transition(':enter', [
        style({ transform: 'translateX(110%)' }),
        animate('0.2s ease-out', style({ transform: 'translateX(0%)' })),
        animate('0.2s {{duration}}ms ease-out', style({ transform: 'translateX(110%)' })),
      ]),
    ]),
  ],
})
export class UnlockNotificationComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  data: UnlockNotificationElementState;
  attributes: ElementAttributes;

  constructor(private unlockNotificationService: UnlockNotificationService) {}

  ngOnInit(): void {
    this.subscription = this.unlockNotificationService.subject.subscribe((state) => {
      this.data = state.data;
      this.attributes = state.attributes;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
