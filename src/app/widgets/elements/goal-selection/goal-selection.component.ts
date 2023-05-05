import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CarouselComponent, OwlOptions } from 'ngx-owl-carousel-o';
import { Subscription } from 'rxjs';
import { GoalSelectionService } from 'src/app/services/elements/goal-selection/goal-selection.service';
import { ElementAttributes, Goal, GoalSelectionElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-goal-selection',
  templateUrl: './goal-selection.component.html',
  styleUrls: ['./goal-selection.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible => hidden', [animate('300ms ease-in')]),
      transition('* => visible', [animate('300ms ease-out')]),
    ]),
  ],
})
export class GoalSelectionComponent implements OnInit, OnDestroy {
  subscription: Subscription;
  data: GoalSelectionElementState;
  attributes: ElementAttributes;
  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    nav: false,
    autoplay: false,
    stagePadding: 280,
    margin: 40,
    responsive: {
      0: {
        items: 1,
      },
    },
  };
  currentGoal?: Partial<Goal>;
  animateGoalCompletion = false;

  @ViewChild(CarouselComponent) carousel: CarouselComponent;

  constructor(private goalSelectionService: GoalSelectionService) {}

  ngOnInit(): void {
    this.subscription = this.goalSelectionService.subject.subscribe((state) => {
      this.data = state.data;
      console.log('changed, ', state.data);
      if (!this.currentGoal) {
        this.currentGoal = state.data.goals[0];
      }
      if (state.data.action === 'change-goal') {
        this.shiftSlide();
      } else if (state.data.action === 'select-goal') {
        this.data.onSelect?.(this.currentGoal);
      }

      this.customOptions.loop = !(state.data.action === 'completed-goal');
      this.animateGoalCompletion = state.data.action === 'completed-goal';

      this.attributes = state.attributes;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  shiftSlide() {
    this.carousel.next();
    if (this.currentGoal) {
      this.currentGoal = this.data.goals[(this.currentGoalIdx() + 1) % this.data.goals.length];
    }
  }

  currentGoalIdx() {
    if (!this.currentGoal) {
      return 0;
    }
    return this.data.goals.findIndex((goal) => goal.id === this.currentGoal?.id);
  }
}
