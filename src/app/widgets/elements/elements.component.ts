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
    this.elements.video.state = {
      data: {
        type: 'gif',
        src: 'https://media.giphy.com/media/dZjllNOkjKPnofe34O/giphy-downsized.gif',
        title: 'Did you hear that?',
        description: 'You just created music by hitting the punching bag!',
      },
      attributes: {
        visibility: 'visible',
      },
    };

    setTimeout(() => {
      this.elements.video.state.attributes.visibility = 'hidden';
    }, 5000);
  }
}
