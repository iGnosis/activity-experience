import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { SoundsService } from 'src/app/services/sounds/sounds.service';
import { PreSessionGenre } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-select-genre',
  templateUrl: './select-genre.component.html',
  styleUrls: ['./select-genre.component.scss'],
})
export class SelectGenreComponent implements OnInit {
  @Output() selected = new EventEmitter<string>();

  debouncedPlayMusic: (...args: any[]) => void;

  genres: Array<{ title: PreSessionGenre; selected?: boolean }> = [
    {
      title: 'Classic',
    },
    {
      title: 'Jazz',
    },
    {
      title: 'Rock',
    },
    {
      title: 'Dance',
    },
    {
      title: 'Surprise Me!',
    },
  ];

  intervalId: any;

  playState: 'play' | 'stop' | undefined = undefined;
  constructor(private soundsService: SoundsService) {
    this.debouncedPlayMusic = this.debounce((genre: string) => {
      this.playMusic(genre);
    }, 300);
  }

  ngOnInit(): void {}

  debounce(func: any, timeout = 300) {
    let timer: any;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, timeout);
    };
  }

  playMusic(genre: string) {
    this.playState = 'play';
    this.soundsService.playGenreSound(genre as PreSessionGenre);
  }

  stopMusic(genre?: string) {
    this.playState = 'stop';
    Howler.stop();
  }

  selectGenre(mood: { title: string; selected?: boolean }) {
    this.soundsService.stopGenreSound(mood.title as PreSessionGenre);
    mood.selected = true;
    setTimeout(() => {
      this.selected.emit(mood.title);
    }, 1000);
  }
}
