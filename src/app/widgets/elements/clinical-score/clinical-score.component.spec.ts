import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClinicalScoreComponent } from './clinical-score.component';

describe('ClinicalScoreComponent', () => {
  let component: ClinicalScoreComponent;
  let fixture: ComponentFixture<ClinicalScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClinicalScoreComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClinicalScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
