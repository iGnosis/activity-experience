import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalibrationTutorialComponent } from './calibration-tutorial.component';

describe('CalibrationTutorialComponent', () => {
  let component: CalibrationTutorialComponent;
  let fixture: ComponentFixture<CalibrationTutorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalibrationTutorialComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CalibrationTutorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
