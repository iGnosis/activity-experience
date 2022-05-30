import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SoundsService } from 'src/app/services/sounds/sounds.service';
import { PreSessionMood } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-pre-session-survey',
  templateUrl: './pre-session-survey.component.html',
  styleUrls: ['./pre-session-survey.component.scss'],
})
export class PreSessionSurveyComponent implements OnInit {
  @Output() selected = new EventEmitter<string>();

  moods: Array<{ title: PreSessionMood; icon: string; selected?: boolean }> = [
    {
      title: 'Irritated',
      icon: 'assets/images/moods/irritated.svg',
    },
    {
      title: 'Anxious',
      icon: 'assets/images/moods/anxious.svg',
    },
    {
      title: 'Okay',
      icon: 'assets/images/moods/okay.svg',
    },
    {
      title: 'Good',
      icon: 'assets/images/moods/good.svg',
    },
    {
      title: 'Daring',
      icon: 'assets/images/moods/daring.svg',
    },
  ];

  constructor(private soundsService: SoundsService) {}

  ngOnInit(): void {
    this.soundsService.playPreSessionMoodSound();
  }

  selectMood(mood: { title: string; selected?: boolean }) {
    this.soundsService.stopPreSessionMoodSound();
    mood.selected = true;
    setTimeout(() => {
      this.selected.emit(mood.title);
    }, 1000);
  }
}
