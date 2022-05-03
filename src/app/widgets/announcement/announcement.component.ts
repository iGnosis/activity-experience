import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AnnouncementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-announcement',
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss'],
})
export class AnnouncementComponent implements OnInit {
  @Input() text: string | undefined;
  state$;
  background = '';

  constructor(private store: Store<{ announcement: AnnouncementState }>) {
    this.state$ = this.store.select((state) => state.announcement);
    this.state$.subscribe((announcement) => {
      this.background = announcement.background || '#88EBA9';
      this.text = announcement.message;

      if (announcement.timeout) {
        setTimeout(() => {
          // Hide the component
          this.text = '';
        }, announcement.timeout);
      }
    });
  }

  ngOnInit(): void {}
}
