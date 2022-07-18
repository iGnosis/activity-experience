import { Component, OnDestroy, OnInit } from '@angular/core';
import { ElementsService } from 'src/app/services/elements/elements.service';
import { ElementsObservables, ElementsState } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-elements',
  templateUrl: './elements.component.html',
  styleUrls: ['./elements.component.scss'],
})
export class ElementsComponent implements OnInit, OnDestroy {
  state: ElementsState;
  observables$: ElementsObservables;
  constructor(private elements: ElementsService) {
    this.state = elements.getElementsState();
    this.observables$ = elements.getElementsObservables();
  }

  ngOnDestroy(): void {
    Object.keys(this.observables$).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.observables$[key].unsubscribe();
    });
  }

  ngOnInit(): void {
    Object.keys(this.observables$).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.observables$[key].subscribe((value) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.state[key] = value;
      });
    });
  }

  updateElement() {
    this.elements.video.set({
      type: 'youtube',
      src: 'https://www.youtube.com/embed/chw2oMUrh4U?autoplay=1',
      title: 'Did you hear that?',
      description: 'You just created music by hitting the punching bag!',
    });
    // this.elements.video.set({
    //   type: 'gif',
    //   src: 'https://media.giphy.com/media/dZjllNOkjKPnofe34O/giphy-downsized.gif',
    //   title: 'Did you hear that?',
    //   description: 'You just created music by hitting the punching bag!',
    // });
    // this.elements.video.set({
    //   type: 'video',
    //   src: 'assets/sh-login.mkv',
    //   title: 'Did you hear that?',
    //   description: 'You just created music by hitting the punching bag!',
    // });
  }
}
