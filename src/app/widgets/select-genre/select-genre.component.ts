import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-select-genre',
  templateUrl: './select-genre.component.html',
  styleUrls: ['./select-genre.component.scss'],
})
export class SelectGenreComponent implements OnInit {
  @Output() selected = new EventEmitter<string>();

  genres: Array<{ title: string; selected?: boolean }> = [
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

  constructor() {}

  ngOnInit(): void {}

  selectGenre(mood: { title: string; selected?: boolean }) {
    mood.selected = true;
    setTimeout(() => {
      this.selected.emit(mood.title);
    }, 1000);
  }
}
