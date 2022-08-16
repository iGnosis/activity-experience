import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/services/elements/toast/toast.service';
import { ElementAttributes, ToastElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit, OnDestroy {
  state: { data: ToastElementState; attributes: object & ElementAttributes };
  subscription: Subscription;
  show = true;

  constructor(private toastService: ToastService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    console.log('toast component init');
    this.subscription = this.toastService.subject.subscribe((state) => {
      console.log('ToastComponent:subscription:state:', state);
      this.state = state;
    });
  }
}
