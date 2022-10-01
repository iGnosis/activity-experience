import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Howl } from 'howler';
import { Observable, retry } from 'rxjs';
import { Genre, SessionState } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { JwtService } from '../jwt/jwt.service';
import { audioSprites } from './audio-sprites';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  genre = 'Jazz';
  constructor(private jwtService: JwtService) {}

  constantDrumId?: number;
  currentChord = 1;
  isEnabled = false;

  sessionStartSound!: Howl;
  rewardSound!: Howl;

  classicalInstructionsSound: Howl;
  rockInstructionsSound: Howl;
  jazzInstructionsSound: Howl;
  danceInstructionsSound: Howl;
  surpriseInstructionsSound: Howl;

  activityErrorSound: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_incorrect.mp3',
    html5: true,
  });
  activitySuccessSound: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Success .mp3',
    html5: true,
  });
  calibrationSuccessSound: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_calibrated.mp3',
    html5: true,
  });
  calibrationErrorSound: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_decalibrate.mp3',
    html5: true,
  });

  preSessionMoodSound = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Feelings Prompt.mp3',
    html5: true,
    loop: true,
  });

  feelingSelectionSound = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Feeling Selection.mp3',
    html5: true,
  });

  preSessionGenreClassic: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Classical.mp3',
    html5: true,
    loop: true,
  });
  preSessionGenreJazz: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Jazz.mp3',
    html5: true,
    loop: true,
  });
  preSessionGenreRock: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Rock.mp3',
    html5: true,
    loop: true,
  });
  preSessionGenreDance: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Dance.mp3',
    html5: true,
    loop: true,
  });
  preSessionGenreSurprise: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_surprise me.mp3',
    html5: true,
    loop: true,
  });

  loadMusicFiles(genre: Genre) {
    console.log('loading ', genre, ' files');
    switch (genre) {
      case 'surprise me!':
        this.surpriseInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Surprise Me Instructions.mp3',
          html5: true,
          loop: true,
        });

        break;
      case 'dance':
        this.danceInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Dance Instructions.mp3',
          html5: true,
          loop: true,
        });

        break;
      case 'rock':
        this.rockInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Rock Instructions.mp3',
          html5: true,
          loop: true,
        });

        break;
      case 'classical':
        this.classicalInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Classical Instructions.mp3',
          html5: true,
          loop: true,
        });

        break;
      case 'jazz':
        this.jazzInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Jazz Instructions.mp3',
          html5: true,
          loop: true,
        });
        break;
    }
  }

  // TODO: remove preSession sounds from sped up activity
  playSessionStartSound() {
    this.sessionStartSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_Starting Session.mp3',
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
    this.preSessionMoodSound.play();
  }

  stopPreSessionMoodSound() {
    if (this.preSessionMoodSound.playing()) {
      this.preSessionMoodSound.stop();
    }
  }

  playActivityInstructionSound(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (!this.classicalInstructionsSound.playing()) {
          this.classicalInstructionsSound.volume(0.15);
          this.classicalInstructionsSound.play();
        }
        break;
      case 'jazz':
        if (!this.jazzInstructionsSound.playing()) {
          this.jazzInstructionsSound.volume(0.15);
          this.jazzInstructionsSound.play();
        }
        break;
      case 'rock':
        if (!this.rockInstructionsSound.playing()) {
          this.rockInstructionsSound.volume(0.15);
          this.rockInstructionsSound.play();
        }
        break;
      case 'dance':
        if (!this.danceInstructionsSound.playing()) {
          this.danceInstructionsSound.volume(0.15);
          this.danceInstructionsSound.play();
        }
        break;
      case 'surprise me!':
        if (!this.surpriseInstructionsSound.playing()) {
          this.surpriseInstructionsSound.volume(0.15);
          this.surpriseInstructionsSound.play();
        }
        break;
    }
  }

  pauseActivityInstructionSound(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (this.classicalInstructionsSound.playing()) {
          this.classicalInstructionsSound.pause();
        }
        break;
      case 'jazz':
        if (this.jazzInstructionsSound.playing()) {
          this.jazzInstructionsSound.pause();
        }
        break;
      case 'rock':
        if (this.rockInstructionsSound.playing()) {
          this.rockInstructionsSound.pause();
        }
        break;
      case 'dance':
        if (this.danceInstructionsSound.playing()) {
          this.danceInstructionsSound.pause();
        }
        break;
      case 'surprise me!':
        if (this.surpriseInstructionsSound.playing()) {
          this.surpriseInstructionsSound.pause();
        }
        break;
    }
  }

  playActivitySound(type: 'success' | 'error') {
    switch (type) {
      case 'success':
        this.activitySuccessSound.play();
        break;
      case 'error':
        this.activityErrorSound.play();
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

  playRewardSound() {
    this.rewardSound = new Howl({
      src: 'assets/sounds/soundscapes/Sound Health Soundscape_reward.mp3',
      html5: true,
    });
    this.rewardSound.play();
  }

  stopRewardSound() {
    if (this.rewardSound.playing()) {
      this.rewardSound.stop();
    }
  }

  tts(text: string, speaker = 'mila') {
    if (environment.speedUpSession) return;

    const requestHeaders = new Headers();
    requestHeaders.set('Authorization', `Bearer ${this.jwtService.getToken()!}`);

    const reqUrl = environment.apiEndpoint + '/speech/generate?text=' + encodeURIComponent(text);
    fetch(reqUrl, {
      headers: requestHeaders,
    })
      .then((reqUrl) => reqUrl.blob())
      .then((data) => {
        // console.log('data:', data);
        const blob = new Blob([data], { type: 'audio/mpeg' });
        const objectUrl = URL.createObjectURL(blob);
        // console.log('getAudio:objectUrl:', objectUrl);
        const sound = new Howl({
          src: objectUrl,
          autoplay: true,
          html5: true,
          format: ['mpeg'],
        });
        sound.play();
      });
  }

  stopAllAudio() {
    // Howler.stop();
  }
}
