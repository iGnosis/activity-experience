import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreSessionSurveyComponent } from './pre-session-survey.component';

describe('PreSessionSurveyComponent', () => {
  let component: PreSessionSurveyComponent;
  let fixture: ComponentFixture<PreSessionSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreSessionSurveyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PreSessionSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
