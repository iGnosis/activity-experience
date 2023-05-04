import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalSelectionComponent } from './goal-selection.component';

describe('GoalSelectionComponent', () => {
  let component: GoalSelectionComponent;
  let fixture: ComponentFixture<GoalSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GoalSelectionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
