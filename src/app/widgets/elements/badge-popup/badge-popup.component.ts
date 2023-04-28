import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BadgePopupService } from 'src/app/services/elements/badge-popup/badge-popup.service';
import { ElementAttributes } from 'src/app/types/pointmotion';
import { BadgePopupElementState } from 'src/app/types/pointmotion';
import { trigger, transition, style, animate } from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [style({ opacity: 0 }), animate('0.5s ease-in', style({ opacity: 1 }))]),
  transition(':leave', [animate('0.5s ease-out', style({ opacity: 0 }))]),
]);

@Component({
  selector: 'element-badge-popup',
  templateUrl: './badge-popup.component.html',
  styleUrls: ['./badge-popup.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate('0.5s ease-in', style({ opacity: 1 }))]),
      transition(':leave', [animate('0.5s ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class BadgePopupComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  state: BadgePopupElementState;
  attributes: ElementAttributes;

  themeMapping = {
    green: {
      iconUrl: 'assets/images/badges/green.png',
      backgroundColor: '#60d660',
    },
    bronze: {
      iconUrl: 'assets/images/badges/bronze.png',
      backgroundColor: 'rgb(249,216,132)',
    },
    gold: {
      iconUrl: 'assets/images/badges/gold.png',
      backgroundColor: 'rgb(250,220,146)',
    },
    purple: {
      iconUrl: 'assets/images/badges/purple.png',
      backgroundColor: '#9f72df',
    },
  };

  constructor(private badgePopupService: BadgePopupService) {}

  ngOnDestroy(): void {
    console.log('badge-popup ngOnDestroy');
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.badgePopupService.subject.subscribe((results) => {
      console.log('BannerComponent:subscription:results:', results);
      this.state = results.data;
      this.attributes = results.attributes;
    });
  }
}
