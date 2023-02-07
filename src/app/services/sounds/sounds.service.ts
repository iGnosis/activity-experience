import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { Genre } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  constructor() {}

  private classicalInstructionsSound: Howl;
  private rockInstructionsSound: Howl;
  private jazzInstructionsSound: Howl;
  private danceInstructionsSound: Howl;
  private surpriseInstructionsSound: Howl;
  private calibrationSuccessSound: Howl;
  private calibrationErrorSound: Howl;

  private loadCommonMusicFiles() {
    this.calibrationSuccessSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_calibrated.mp3',
      html5: true,
    });
    this.calibrationErrorSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
      html5: true,
    });
  }

  loadMusicFiles(genre: Genre) {
    console.log('loading ', genre, ' files');

    this.loadCommonMusicFiles();

    switch (genre) {
      case 'surprise me!':
        this.surpriseInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Surprise Me Instructions.mp3',
          html5: true,
          loop: true,
        });
        return;
      case 'dance':
        this.danceInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Dance Instructions.mp3',
          html5: true,
          loop: true,
        });
        return;
      case 'rock':
        this.rockInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Rock Instructions.mp3',
          html5: true,
          loop: true,
        });
        return;
      case 'classical':
        this.classicalInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Classical Instructions.mp3',
          html5: true,
          loop: true,
        });
        return;
      case 'jazz':
      default:
        this.jazzInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Jazz Instructions.mp3',
          html5: true,
          loop: true,
        });
        return;
    }
  }

  playActivityInstructionSound(genre: Genre) {
    // because instruction music is too loud during guide.
    const volume = 0.15;
    switch (genre) {
      case 'classical':
        if (this.classicalInstructionsSound && !this.classicalInstructionsSound.playing()) {
          this.classicalInstructionsSound.volume(volume);
          this.classicalInstructionsSound.play();
        }
        break;
      case 'jazz':
        if (this.jazzInstructionsSound && !this.jazzInstructionsSound.playing()) {
          this.jazzInstructionsSound.volume(volume);
          this.jazzInstructionsSound.play();
        }
        break;
      case 'rock':
        if (this.rockInstructionsSound && !this.rockInstructionsSound.playing()) {
          this.rockInstructionsSound.volume(volume);
          this.rockInstructionsSound.play();
        }
        break;
      case 'dance':
        if (this.danceInstructionsSound && !this.danceInstructionsSound.playing()) {
          this.danceInstructionsSound.volume(volume);
          this.danceInstructionsSound.play();
        }
        break;
      case 'surprise me!':
        if (this.surpriseInstructionsSound && !this.surpriseInstructionsSound.playing()) {
          this.surpriseInstructionsSound.volume(volume);
          this.surpriseInstructionsSound.play();
        }
        break;
    }
  }

  stopActivityInstructionSound(genre: Genre) {
    switch (genre) {
      case 'classical':
        this.classicalInstructionsSound && this.classicalInstructionsSound.stop();
        break;
      case 'jazz':
        this.jazzInstructionsSound && this.jazzInstructionsSound.stop();

        break;
      case 'rock':
        this.rockInstructionsSound && this.rockInstructionsSound.stop();
        break;
      case 'dance':
        this.danceInstructionsSound && this.danceInstructionsSound.stop();

        break;
      case 'surprise me!':
        this.surpriseInstructionsSound && this.surpriseInstructionsSound.stop();
        break;
    }
  }

  playCalibrationSound(type: 'success' | 'error') {
    switch (type) {
      case 'success':
        this.calibrationSuccessSound.play();
        break;
      case 'error':
        this.calibrationErrorSound.play();
        break;
    }
  }
}
