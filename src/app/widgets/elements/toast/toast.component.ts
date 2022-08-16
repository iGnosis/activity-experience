import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/services/elements/toast/toast.service';
import { ElementAttributes, ToastElementState } from 'src/app/types/pointmotion';
declare let $: any;

@Component({
  selector: 'element-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
})
export class ToastComponent implements OnInit, OnDestroy {
  state: { data: ToastElementState; attributes: object & ElementAttributes } = {
    data: {
      header: '.',
      body: '.',
    },
    attributes: {
      visibility: 'visible',
    },
  };

  subscription: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.toastService.subject.subscribe((state) => {
      console.log('ToastComponent:subscription:state:', state);
      this.state = state;
      $('.toast').toast({
        // By default, popup closes after 5 seconds.
        delay: state.data.delay || 5000,
      });
      $('.toast').toast('show');
    });
  }

  closeToast() {
    console.log('toast closed');
    $('.toast').toast('hide');
  }
}
