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

  preSessionGenreClassicId: number;
  preSessionGenreJazzId: number;
  preSessionGenreRockId: number;
  preSessionGenreDanceId: number;
  preSessionGenreSurpriseId: number;

  surprise: Howl;
  dance: Howl;
  rock: Howl;
  jazz: Howl;
  classicalBacktrack: Howl;
  classicalTrigger: Howl;
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

  loadMusicFiles(genre: Genre) {
    console.log('loading ', genre, ' files');
    switch (genre) {
      case 'surprise me!':
        this.surpriseInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Surprise Me Instructions.mp3',
          html5: true,
          loop: true,
        });
        this.surprise = new Howl({
          src: 'assets/sounds/soundsprites/ambient/ambientSprite.mp3',
          sprite: audioSprites.surpriseSprite,
        });
        break;
      case 'dance':
        this.danceInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Dance Instructions.mp3',
          html5: true,
          loop: true,
        });
        this.dance = new Howl({
          src: 'assets/sounds/soundsprites/dance/danceSprite.mp3',
          sprite: audioSprites.danceSprite,
        });
        break;
      case 'rock':
        this.rockInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Rock Instructions.mp3',
          html5: true,
          loop: true,
        });
        this.rock = new Howl({
          src: 'assets/sounds/soundsprites/rock/rockSprite.mp3',
          sprite: audioSprites.rockSprite,
        });
        break;
      case 'classical':
        this.classicalInstructionsSound = new Howl({
          src: 'assets/sounds/soundscapes/Classical Instructions.mp3',
          html5: true,
          loop: true,
        });
        this.classicalBacktrack = new Howl({
          src: 'assets/sounds/soundsprites/classical/classicalSprite.mp3',
          sprite: audioSprites.classicalBacktrackSprite,
        });

        this.classicalTrigger = new Howl({
          src: 'assets/sounds/soundsprites/classical/classicalSprite.mp3',
          sprite: audioSprites.classicalSprite,
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

  classicTriggerFadeoutDuration = 4519.183673469399 - 3000;
  isBacktrackPlaying(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (this.currentClassicalBacktrackId) {
          return this.classicalBacktrack.playing(this.currentClassicalBacktrackId);
        }
        return false;
      case 'dance':
        if (this.danceBacktrackId) {
          return this.dance.playing(this.danceBacktrackId);
        }
        return false;
      case 'rock':
        if (this.rockBacktrackId) {
          return this.rock.playing(this.rockBacktrackId);
        }
        return false;
      case 'surprise me!':
        return false;
      case 'jazz':
        return this.isConstantDrumPlaying();
      default:
        return false;
    }
  }

  pauseBacktrack(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (
          this.currentClassicalBacktrackId &&
          this.classicalBacktrack.playing(this.currentClassicalBacktrackId)
        ) {
          this.classicalBacktrack.pause(this.currentClassicalBacktrackId);
        }
        break;
      case 'dance':
        if (this.danceBacktrackId && this.dance.playing(this.danceBacktrackId)) {
          this.dance.pause(this.danceBacktrackId);
        }
        break;
      case 'rock':
        if (this.rockBacktrackId && this.rock.playing(this.rockBacktrackId)) {
          this.rock.pause(this.rockBacktrackId);
        }
        break;
      case 'surprise me!':
        return;
      case 'jazz':
        this.pauseConstantDrum();
    }
  }

  currentClassicalSet = 1;
  currentClassicalRep = 1;
  currentClassicalBacktrackId: number;
  currentClassicalTriggerId: number;
  danceBacktrackId: number;
  danceTriggerId: number;
  currentDanceTrigger = 1;
  rockBacktrackId: number;
  rockTriggerId: number;
  currentRockTrigger = 1;
  ambientTriggerId: number;
  currentAmbientTrigger = 1;
  playMusic(genre: Genre, type: 'backtrack' | 'trigger') {
    switch (genre) {
      case 'classical':
        if (!this.classicalBacktrack || !this.classicalTrigger) {
          return;
        }
        if (type === 'backtrack') {
          console.log(`playing backtrack set${this.currentClassicalSet}`);
          if (this.classicalBacktrack.playing(this.currentClassicalBacktrackId)) {
            this.classicalBacktrack.stop(this.currentClassicalBacktrackId);
          }
          this.currentClassicalBacktrackId = this.classicalBacktrack.play(
            `backtrack set${this.currentClassicalSet}`,
          );
        } else {
          console.log(`playing set${this.currentClassicalSet}rep${this.currentClassicalRep}`);
          const soundTrackKey = `set${this.currentClassicalSet}rep${this.currentClassicalRep}`;
          if (this.classicalTrigger.playing(this.currentClassicalTriggerId)) {
            this.classicalTrigger.stop(this.currentClassicalTriggerId);
          }
          this.classicalTrigger.volume(0.7);
          this.currentClassicalTriggerId = this.classicalTrigger.play(soundTrackKey);
          this.classicalTrigger.fade(0, 0.7, 1500, this.currentClassicalTriggerId);
          setTimeout(() => {
            this.classicalTrigger.fade(
              0.7,
              0,
              this.classicTriggerFadeoutDuration,
              this.currentClassicalTriggerId,
            );
          }, 1500);
          this.currentClassicalRep += 1;
          if (this.currentClassicalSet === 1 && this.currentClassicalRep === 12) {
            console.log('set 1 ended, starting set 2, resetting reps to 0');
            this.currentClassicalSet = 2;
            this.currentClassicalRep = 1;
            if (this.classicalBacktrack.playing(this.currentClassicalBacktrackId)) {
              this.classicalBacktrack.stop(this.currentClassicalBacktrackId);
            }
            this.currentClassicalBacktrackId = this.classicalBacktrack.play(
              `backtrack set${this.currentClassicalSet}`,
            );
          } else if (this.currentClassicalSet === 2 && this.currentClassicalRep === 12) {
            console.log('set 2 ended, starting set 3, resetting reps to 0');
            this.currentClassicalSet = 3;
            this.currentClassicalRep = 1;
            if (this.classicalBacktrack.playing(this.currentClassicalBacktrackId)) {
              this.classicalBacktrack.stop(this.currentClassicalBacktrackId);
            }
            this.currentClassicalBacktrackId = this.classicalBacktrack.play(
              `backtrack set${this.currentClassicalSet}`,
            );
          } else if (this.currentClassicalSet === 3 && this.currentClassicalRep === 14) {
            console.log('set 3 ended, starting set 1, resetting reps to 0');
            this.currentClassicalSet = 1;
            this.currentClassicalRep = 1;
            if (this.classicalBacktrack.playing(this.currentClassicalBacktrackId)) {
              this.classicalBacktrack.stop(this.currentClassicalBacktrackId);
            }
            this.currentClassicalBacktrackId = this.classicalBacktrack.play(
              `backtrack set${this.currentClassicalSet}`,
            );
          }
        }
        break;
      case 'dance':
        if (!this.dance) {
          return;
        }
        if (type === 'backtrack') {
          console.log('playing dance backtrack');
          if (!this.dance.playing(this.danceBacktrackId)) {
            this.danceBacktrackId = this.dance.play('backtrack');
          }
        } else {
          this.danceTriggerId = this.dance.play(`trigger${this.currentDanceTrigger}`);
          this.currentDanceTrigger += 1;
          if (this.currentDanceTrigger === 33) {
            this.currentDanceTrigger = 1;
          }
        }
        break;
      case 'rock':
        if (!this.rock) {
          return;
        }
        if (type === 'backtrack') {
          console.log('playing rock backtrack');
          if (!this.rock.playing(this.rockBacktrackId)) {
            this.rockBacktrackId = this.rock.play('backtrack');
          }
        } else {
          this.rockTriggerId = this.rock.play(`rock${this.currentRockTrigger}`);
          this.currentRockTrigger += 1;
          if (this.currentRockTrigger === 17) {
            this.currentRockTrigger = 1;
          }
        }
        break;
      case 'surprise me!':
        if (!this.surprise) {
          return;
        }
        if (type === 'backtrack') {
          console.log('No ambient backtrack');
          return;
        } else {
          if (this.surprise.playing(this.ambientTriggerId)) {
            this.surprise.stop(this.ambientTriggerId);
          }
          this.ambientTriggerId = this.surprise.play(`ambient ${this.currentAmbientTrigger}`);
          this.currentAmbientTrigger += 1;
          if (this.currentAmbientTrigger === 17) {
            this.currentAmbientTrigger = 1;
          }
        }
        break;
      case 'jazz':
        if (type === 'backtrack') {
          this.playConstantDrum();
        } else {
          this.playNextChord();
        }
    }
  }

  playConstantDrum() {
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

  playGenreSound(genre: Genre) {
    if (this.preSessionMoodSound.playing()) {
      this.preSessionMoodSound.stop();
    }
    switch (genre) {
      case 'classical':
        if (!this.preSessionGenreClassic.playing(this.preSessionGenreClassicId)) {
          this.preSessionGenreClassicId = this.preSessionGenreClassic
            .fade(0, 80, 3000, this.preSessionGenreClassicId)
            .play();
        }
        break;
      case 'jazz':
        if (!this.preSessionGenreJazz.playing(this.preSessionGenreJazzId)) {
          this.preSessionGenreJazzId = this.preSessionGenreJazz.fade(0, 80, 3000).play();
        }
        break;
      case 'rock':
        if (!this.preSessionGenreRock.playing(this.preSessionGenreRockId)) {
          this.preSessionGenreRockId = this.preSessionGenreRock.fade(0, 80, 3000).play();
        }
        break;
      case 'dance':
        if (!this.preSessionGenreDance.playing(this.preSessionGenreDanceId)) {
          this.preSessionGenreDanceId = this.preSessionGenreDance.fade(0, 80, 3000).play();
        }
        break;
      case 'surprise me!':
        if (!this.preSessionGenreSurprise.playing(this.preSessionGenreSurpriseId)) {
          this.preSessionGenreSurpriseId = this.preSessionGenreSurprise.fade(0, 80, 3000).play();
        }
        break;
    }
  }

  stopGenreSound(genre?: Genre) {
    Howler.stop();
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
