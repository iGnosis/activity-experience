import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnlockNotificationComponent } from './unlock-notification.component';

describe('UnlockNotificationComponent', () => {
  let component: UnlockNotificationComponent;
  let fixture: ComponentFixture<UnlockNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnlockNotificationComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnlockNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
