import { Component, OnInit } from '@angular/core';
import { trigger, transition, animate, style, state } from '@angular/animations';
import { RibbonService } from 'src/app/services/elements/ribbon/ribbon.service';

@Component({
  selector: 'element-ribbon',
  templateUrl: './ribbon.component.html',
  styleUrls: ['./ribbon.component.scss'],
  animations: [
    trigger('textSlideIn', [
      state('enter', style({ transform: 'translateX(-100vw)' })),
      state('open', style({ transform: 'translateX(0%)' })),
      state('exit', style({ transform: 'translateX(100vw)' })),
      transition('enter => open', animate('0.3s ease-in')),
      transition('* => exit', animate('0.3s ease-in')),
    ]),
    trigger('bgFadeIn', [
      state('enter', style({ transform: 'translateY(-50%) scale(0.3)', opacity: 0 })),
      state('open', style({ transform: 'translateY(-50%) scale(1)', opacity: 1 })),
      state('exit', style({ transform: 'translateY(-50%) scale(0.3)', opacity: 0 })),
      transition('* => open', animate('0.2s ease-in')),
      transition('* => exit', animate('0.2s ease-in')),
    ]),
  ],
})
export class RibbonComponent implements OnInit {
  titles!: string[];
  title: string;
  bgAnimationState = 'enter';
  textAnimationState = 'enter';
  transitionDuration?: number;
  constructor(private ribbonService: RibbonService) {}

  ngOnInit(): void {
    this.ribbonService.hide();
    this.titles = this.ribbonService.state.titles;
    this.transitionDuration = this.ribbonService.state.transitionDuration;
    this.showTitles();
  }
  showTitles() {
    let i = -1;
    this.bgAnimationState = 'open';
    this.textAnimationState = 'enter';
    const int = setInterval(async () => {
      if (this.textAnimationState === 'open') {
        this.textAnimationState = 'exit';
      } else if (this.textAnimationState === 'exit') {
        this.textAnimationState = 'enter';
      } else {
        if (i === this.titles.length - 1) {
          this.bgAnimationState = 'exit';
          clearInterval(int);
        }
        this.title = this.titles[++i];
        this.textAnimationState = 'open';
      }
    }, this.transitionDuration || 500);
  }
}
