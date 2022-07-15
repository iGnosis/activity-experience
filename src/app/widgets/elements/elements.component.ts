import { Component, OnDestroy, OnInit } from '@angular/core';
import { ElementsService } from 'src/app/services/elements/elements.service';
import { ElementsObservables, ElementsState, PromptPosition } from 'src/app/types/pointmotion';

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
    this.elements.prompt.setValue('17');
    // demonstrate prompt change after some time...
    setTimeout(() => {
      this.elements.prompt.setValue('21');
      this.elements.prompt.setPosition('center');
    }, 1000)

    setTimeout(() => {
      this.elements.prompt.hide()
    }, 1500);
  }
}
