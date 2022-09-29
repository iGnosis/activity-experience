import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { SoundsService } from 'src/app/services/sounds/sounds.service';
import { session } from 'src/app/store/actions/session.actions';
import { Genre } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-select-genre',
  templateUrl: './select-genre.component.html',
  styleUrls: ['./select-genre.component.scss'],
})
export class SelectGenreComponent implements OnInit {
  @Output() selected = new EventEmitter<string>();
  timer: any;

  debouncedPlayMusic: (...args: any[]) => void;

  genres: Array<{ title: Genre; selected?: boolean }> = [
    {
      title: 'classical',
    },
    {
      title: 'jazz',
    },
    {
      title: 'rock',
    },
    {
      title: 'dance',
    },
    {
      title: 'surprise me!',
    },
  ];

  intervalId: any;

  playState: 'play' | 'stop' | undefined = undefined;
  constructor(private soundsService: SoundsService, private store: Store) {
    this.debouncedPlayMusic = this.debounce((genre: string) => {
      this.playMusic(genre);
    }, 300);
  }

  ngOnInit(): void {}

  debounce(func: any, timeout = 300) {
    return (...args: any[]) => {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  playMusic(genre: string) {
    this.playState = 'play';
    // this.soundsService.playGenreSound(genre as Genre);
  }

  stopMusic(genre?: string) {
    if (genre) clearTimeout(this.timer);
    this.playState = 'stop';
    Howler.stop();
  }

  selectGenre(mood: { title: string; selected?: boolean }) {
    // this.soundsService.stopGenreSound(mood.title as Genre);
    mood.selected = true;
    this.store.dispatch(session.setGenre({ genre: mood.title as Genre }));
    setTimeout(() => {
      this.selected.emit(mood.title);
    }, 1000);
  }
}
