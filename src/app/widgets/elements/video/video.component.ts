import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoService } from 'src/app/services/elements/video/video.service';
import { ElementAttributes, VideoElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
  animations: [
    trigger('zoomInOut', [
      transition(':enter', [
        animate(
          '300ms 0ms ease-in',
          keyframes([
            style({ transform: 'translate(-50%, -50%) scale(0.5)', opacity: '0' }),
            style({ transform: 'translate(-50%, -50%) scale(1)', opacity: '100' }),
          ]),
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms 0ms ease-out',
          keyframes([
            style({ transform: 'translate(-50%, -50%) scale(1)', opacity: '100' }),
            style({ transform: 'translate(-50%, -50%) scale(0.5)', opacity: '0' }),
          ]),
        ),
      ]),
    ]),
  ],
})
export class VideoElementComponent implements OnInit, OnDestroy {
  state: VideoElementState;
  attributes: ElementAttributes;
  subscription: Subscription;

  constructor(private videoService: VideoService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.videoService.subject.subscribe((value) => {
      this.attributes = value.attributes;
      this.state = value.data;
    });
  }
}
