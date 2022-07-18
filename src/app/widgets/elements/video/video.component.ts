import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VideoService } from 'src/app/services/elements/video/video.service';
import { ElementAttributes, VideoElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
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
      console.log(value);
      this.attributes = value.attributes;
      this.state = value.data;
    });
  }
}
