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
      this.elements.prompt.setValue('21');
    }, 500);

    setTimeout(() => {
      this.elements.prompt.setValue('50');
    }, 5000);

    setTimeout(() => {
      this.elements.prompt.hide();
    }, 7000);
  }

  testIntroBannerElement() {
    this.elements.banner.show();
    this.elements.banner.setState({
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
    });
    // setInterval(() => {
    //   this.elements.banner.hide();
    // }, 2000)
  }

  testOutroBannerElement() {
    this.elements.banner.show();
    this.elements.banner.setState({
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
    });
    // setInterval(() => {
    //   this.elements.banner.hide();
    // }, 2000);
  }
}
