import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConfettiService } from 'src/app/services/elements/confetti/confetti.service';
import { ConfettiElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-confetti',
  templateUrl: './confetti.component.html',
  styleUrls: ['./confetti.component.scss'],
})
export class ConfettiComponent implements OnInit, OnDestroy {
  state: { data: ConfettiElementState; attributes: object & ElementAttributes };
  subscription: Subscription;

  constructor(private confettiService: ConfettiService) {}
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.confettiService.subject.subscribe((value) => {
      this.state = value;
    });
  }
}
