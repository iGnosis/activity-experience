import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { CalibrationTutorialService } from 'src/app/services/elements/calibration-tutorial/calibration-tutorial.service';
import { CalibrationTutorialElementState, ElementAttributes } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-calibration-tutorial',
  templateUrl: './calibration-tutorial.component.html',
  styleUrls: ['./calibration-tutorial.component.scss'],
})
export class CalibrationTutorialComponent implements OnInit, OnDestroy {
  state: { data: CalibrationTutorialElementState; attributes: ElementAttributes };
  subscription: Subscription;
  @ViewChild('videoStep2') videoStep2: ElementRef;
  @ViewChild('videoStep3') videoStep3: ElementRef;
  currentVideoStep = 0;

  constructor(private calibrationTutorialService: CalibrationTutorialService) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngOnInit(): void {
    this.subscription = this.calibrationTutorialService.subject.subscribe((value) => {
      this.state = value;
    });
  }

  hide() {
    this.calibrationTutorialService.hide();
  }

  videoEnded(step: number) {
    this.currentVideoStep = Math.max(this.currentVideoStep, step);
    this.playCurrentStepVideo();
  }

  isVideoPlaying(video: ElementRef) {
    return !!(
      video.nativeElement.currentTime > 0 &&
      !video.nativeElement.paused &&
      !video.nativeElement.ended &&
      video.nativeElement.readyState > 2
    );
  }

  playCurrentStepVideo() {
    if (this.currentVideoStep === 1 && !this.isVideoPlaying(this.videoStep2)) {
      this.videoStep2.nativeElement.classList.add('show');
      this.videoStep2.nativeElement.play();
    } else if (this.currentVideoStep === 2 && !this.isVideoPlaying(this.videoStep3)) {
      this.videoStep3.nativeElement.classList.add('show');
      this.videoStep3.nativeElement.play();
    }
  }
}
