import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgePopupComponent } from './badge-popup.component';

describe('BadgePopupComponent', () => {
  let component: BadgePopupComponent;
  let fixture: ComponentFixture<BadgePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgePopupComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BadgePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
