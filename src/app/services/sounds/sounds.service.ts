import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { PreSessionGenre, PreSessionMood } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  constructor() {}

  constantDrumId?: number;
  currentChord = 1;
  isEnabled = false;

  preSessionMoodSound!: Howl;
  preSessionGenreSound!: Howl;
  preSessionGenreSoundId!: number;
  activityInstructionSound!: Howl;
  activityInstructionSuccessSound!: Howl;
  playActivitySuccessSound!: Howl;
  playActivityErrorSound!: Howl;
  sessionStartSound!: Howl;
  playActivityEndedSound!: Howl;
  calibrationSuccessSound!: Howl;
  calibrationErrorSound!: Howl;

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
      constantDrum: [0, 65567.34693877552, true],
      endingDrum: [67000, 4257.9591836734635],
      inactiveDrum: [73000, 8071.836734693875],
      successDrum: [83000, 574.6938775510273],
    },
  });

  startConstantDrum() {
    if (!this.isConstantDrumPlaying()) {
      this.constantDrumId = this.drums.play('constantDrum');
    }
  }

  pauseConstantDrum() {
    this.drums.pause(this.constantDrumId);
  }

  endConstantDrum() {
    // this.drums.fade(1.0, 0, 2, this.constantDrumId);
    this.drums.stop(this.constantDrumId);
    this.drums.play('endingDrum');
  }

  isConstantDrumPlaying() {
    return this.drums.playing(this.constantDrumId);
  }

  playNextChord() {
    if (this.currentChord >= 9) {
      this.currentChord = 1;
    }
    console.log(`playing CHORD ${this.currentChord}`);
    this.chords.play(`Chord ${this.currentChord}`);
    this.currentChord += 1;
  }

  /**
   *
   * @param from From volume
   * @param to To Volume
   * @param duration Duration of fading
   * @param id (Optional) ID of the music to fade, by default it will take constantDrumId
   */
  fadeDrums(
    from: number,
    to: number,
    duration: number,
    id: number = this.constantDrumId as number,
  ) {
    this.drums.fade(from, to, duration, id);
  }

  // TODO: remove preSession sounds from sped up activity

  playSessionStartSound() {
    this.sessionStartSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_Starting Session.mp3',
      autoplay: true,
      html5: true,
      loop: true,
    });
    this.sessionStartSound.play();
  }

  stopSessionStartSound() {
    if (this.sessionStartSound.playing()) {
      this.sessionStartSound.stop();
    }
  }

  playPreSessionMoodSound() {
    this.preSessionMoodSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_Feelings Prompt.mp3',
      autoplay: true,
      html5: true,
      loop: true,
    });
    this.preSessionMoodSound.play();
  }

  playGenreSound(genre: PreSessionGenre) {
    switch (genre) {
      case 'Classic':
        this.preSessionMoodSound.stop();
        // play sound for genre selection here!
        this.preSessionGenreSound = new Howl({
          src: 'assets/sounds/soundscapes/Sound Health Soundscape_Classical.mp3',
          autoplay: true,
          html5: true,
          loop: true,
        });
        this.preSessionGenreSoundId = this.preSessionGenreSound.play();
        break;
      case 'Jazz':
        this.preSessionMoodSound.stop();
        this.preSessionGenreSound = new Howl({
          src: 'assets/sounds/soundscapes/Sound Health Soundscape_Jazz.mp3',
          autoplay: true,
          html5: true,
          loop: true,
        });
        this.preSessionGenreSoundId = this.preSessionGenreSound.play();
        break;
      case 'Rock':
        this.preSessionMoodSound.stop();
        this.preSessionGenreSound = new Howl({
          src: 'assets/sounds/soundscapes/Sound Health Soundscape_Rock.mp3',
          autoplay: true,
          html5: true,
          loop: true,
        });
        this.preSessionGenreSoundId = this.preSessionGenreSound.play();
        break;
      case 'Dance':
        this.preSessionMoodSound.stop();
        this.preSessionGenreSound = new Howl({
          src: 'assets/sounds/soundscapes/Sound Health Soundscape_Dance.mp3',
          autoplay: true,
          html5: true,
          loop: true,
        });
        this.preSessionGenreSoundId = this.preSessionGenreSound.play();
        break;
      case 'Surprise Me!':
        this.preSessionMoodSound.stop();
        this.preSessionGenreSound = new Howl({
          src: 'assets/sounds/soundscapes/Sound Health Soundscape_surprise me.mp3',
          autoplay: true,
          html5: true,
          loop: true,
        });
        this.preSessionGenreSoundId = this.preSessionGenreSound.play();
        break;
    }
  }

  stopPreSessionMoodSound() {
    if (this.preSessionMoodSound.playing()) {
      this.preSessionMoodSound.stop();
    }
  }

  playActivityInstructionSound() {
    this.activityInstructionSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_Activity Instructions.mp3',
      autoplay: true,
      html5: true,
      loop: true,
    });
    this.activityInstructionSound.volume(0.5);
    this.activityInstructionSound.play();
  }

  resumeActivityInstructionSound() {
    if (!this.activityInstructionSound.playing()) {
      this.activityInstructionSound.play();
    }
  }

  pauseActivityInstructionSound() {
    if (this.activityInstructionSound.playing()) {
      this.activityInstructionSound.pause();
    }
  }

  playActivityInstructionSuccess() {
    this.activityInstructionSuccessSound = new Howl({
      src: 'assets/sounds/temp-calibration-error.mp3',
      autoplay: true,
      html5: true,
    });
    this.activityInstructionSuccessSound.play();
  }

  playActivitySound(type: 'success' | 'error' | 'ended') {
    switch (type) {
      case 'success':
        this.playActivitySuccessSound = new Howl({
          src: 'assets/sounds/temp-activity-error.mp3',
          autoplay: true,
          html5: true,
        });
        this.playActivitySuccessSound.play();
        break;
      case 'error':
        this.playActivityErrorSound = new Howl({
          src: 'assets/sounds/temp-activity-error.mp3',
          autoplay: true,
          html5: true,
        });
        this.playActivityErrorSound.play();
        break;
      case 'ended':
        this.playActivityEndedSound = new Howl({
          src: 'assets/sounds/temp-activity-ended.mp3',
          autoplay: true,
          html5: true,
        });
        this.playActivityEndedSound.play();
        break;
    }
  }

  stopPreSessionGenreSound() {
    if (this.preSessionGenreSound.playing(this.preSessionGenreSoundId)) {
      this.preSessionGenreSound.stop(this.preSessionGenreSoundId);
    }
  }

  playCalibrationSound(type: 'success' | 'error') {
    switch (type) {
      case 'success':
        this.calibrationSuccessSound = new Howl({
          src: 'assets/sounds/temp-calibration-success.mp3',
          autoplay: true,
          html5: true,
        });
        this.calibrationSuccessSound.volume(0.5);
        this.calibrationSuccessSound.play();
        break;
      case 'error':
        this.calibrationErrorSound = new Howl({
          src: 'assets/sounds/temp-calibration-error.mp3',
          autoplay: true,
          html5: true,
        });
        this.calibrationErrorSound.volume(0.5);
        this.calibrationErrorSound.play();
        break;
    }
  }

  tts(text: string, speaker = 'mila') {
    console.log(environment);
    if (environment.speedUpSession) return;

    const sound = new Howl({
      src: [environment.apiEndpoint + '/speech/generate?text=' + encodeURIComponent(text)],
      autoplay: true,
      html5: true,
    });
    sound.play();
  }
}
