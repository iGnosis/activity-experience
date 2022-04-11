import { Injectable } from '@angular/core';
import { Howl } from 'howler';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  constructor() {}

  constant_drum_id?: number;
  current_chord: number = 1;

  chords = new Howl({
    src: 'assets/sounds/soundsprites/chordsSprite.mp3',
    sprite: {
      'Chord 1': [0, 8071.8367346938785],
      'Chord 2': [10000, 8071.8367346938785],
      'Chord 3': [20000, 8071.8367346938785],
      'Chord 4': [30000, 8071.836734693875],
      'Chord 5': [40000, 8071.836734693875],
      'Chord 6': [50000, 8071.836734693875],
      'Chord 7': [60000, 8071.836734693875],
      'Chord 8': [70000, 8071.836734693875],
      'Chord 9': [80000, 8071.836734693875],
    },
  });

  drums = new Howl({
    src: ['assets/sounds/soundsprites/drumsSprite.mp3'],
    sprite: {
      constant_drum: [0, 65567.34693877552, true],
      ending_drum: [67000, 4257.9591836734635],
      inactive_drum: [73000, 8071.836734693875],
      success_drum: [83000, 574.6938775510273],
    },
  });

  startContantDrum() {
    this.constant_drum_id = this.drums.play('constant_drum');
  }

  pauseContantDrum() {
    this.drums.pause(this.constant_drum_id);
  }

  endConstantDrum() {
    // this.drums.fade(1.0, 0, 2, this.constant_drum_id);
    this.drums.stop(this.constant_drum_id);
    this.drums.play('ending_drum');
  }

  isConstantDrumPlaying() {
    return this.drums.playing(this.constant_drum_id);
  }

  playNextChord() {
    if (this.current_chord >= 9) {
      this.current_chord = 1;
    }
    console.log(`playing CHORD ${this.current_chord}`);
    this.chords.play(`Chord ${this.current_chord}`);
    this.current_chord += 1;
  }

  fade(from: number, to: number, duration: number, id?: number | undefined) {
    this.drums.fade(from, to, duration, this.constant_drum_id);
  }
}
