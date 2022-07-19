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

  testPromptElement() {
    this.elements.prompt.show();
    // demonstrate prompt change after some time...
    setTimeout(() => {
      this.elements.prompt.data = { value: '21' };
    }, 500);

    setTimeout(() => {
      this.elements.prompt.data = { value: '50' };
    }, 5000);

    setTimeout(() => {
      this.elements.prompt.hide();
    }, 7000);
  }

  testIntroBannerElement() {
    this.elements.banner.show();
    this.elements.banner.data = {
      htmlStr: `
      <h2 class="pt-2">First Activity</h2>
      <h1 class="pt-3 display-5">Sit, Stand, Achieve</h1>
      <h2 class="pt-6" style="font-weight: 200">Area of Focus</h2>
      <h2 class="pt-2">Balance and Reaction Time</h2>
      `,
      buttons: [
        {
          title: 'Starting Sit, Stand, Achieve',
        },
      ],
    };
  }

  testOutroBannerElement() {
    this.elements.banner.show();
    this.elements.banner.data = {
      htmlStr: `
      <div class="pl-2" style="padding-left: 20px;">
        <h1 class="pt-3 display-4">Sit, Stand, Achieve</h1>
        <h2 class="pt-2">Time: 1:17 minutes</h2>
        <h2 class="pt-2">Fastest Time: 0:31 minutes</h2>
        <h2 class="pt-2">Reps Completed: 10</h2>
      <div>
      `,
      buttons: [
        {
          title: 'Next Activity',
        },
      ],
    };
  }
  updateElement() {
    this.elements.timer.state = {
      data: {
        mode: 'start',
        duration: 10000,
        onComplete: (elapsedTime) => {
          console.log('total elapsed time', elapsedTime);
          this.elements.timer.state.attributes = {
            visibility: 'hidden',
          };
        },
      },
    };
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

    // setTimeout(() => {
    //   this.elements.timer.state = {
    //     data: {
    //       mode: 'stop',
    //     },
    //     attributes: {
    //       visibility: 'hidden',
    //     },
    //   };
    // }, 6000);
    setTimeout(() => {
      this.elements.video.state.attributes.visibility = 'hidden';
    }, 5000);
  }
}
