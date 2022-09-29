import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { VideoService } from 'src/app/services/video/video.service';
import { Observable } from 'rxjs';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
import { Genre } from 'src/app/types/pointmotion';
import { Howl } from 'howler';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';

@Injectable({
  providedIn: 'root',
})
export class SitToStandScene extends Phaser.Scene {
  musicFilesLoaded = 0;
  loadError = false;

  constructor() {
    super({ key: 'sit2stand' });
  }

  jazzTrigger: Howl;
  jazzBacktrack: Howl;

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

  preload() {}

  loadMusicFiles(genre: Genre) {
    console.log('loading ', genre, ' files');
    switch (genre) {
      case 'surprise me!':
        this.surprise = new Howl({
          src: 'assets/sounds/soundsprites/ambient/ambientSprite.mp3',
          sprite: audioSprites.surpriseSprite,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'dance':
        this.dance = new Howl({
          src: 'assets/sounds/soundsprites/dance/danceSprite.mp3',
          sprite: audioSprites.danceSprite,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'rock':
        this.rock = new Howl({
          src: 'assets/sounds/soundsprites/rock/rockSprite.mp3',
          sprite: audioSprites.rockSprite,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'classical':
        this.classicalBacktrack = new Howl({
          src: 'assets/sounds/soundsprites/classical/classicalSprite.mp3',
          sprite: audioSprites.classicalBacktrackSprite,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });

        this.classicalTrigger = new Howl({
          src: 'assets/sounds/soundsprites/classical/classicalSprite.mp3',
          sprite: audioSprites.classicalSprite,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'jazz':
        this.jazzTrigger = new Howl({
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
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });

        this.jazzBacktrack = new Howl({
          src: ['assets/sounds/soundsprites/drumsSprite.mp3'],
          sprite: {
            constantDrum: [0, 65567.34693877552, true],
            endingDrum: [67000, 4257.9591836734635],
            inactiveDrum: [73000, 8071.836734693875],
            successDrum: [83000, 574.6938775510273],
          },
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
    }
  }

  onLoadCallback = () => {
    this.musicFilesLoaded += 1;
  };

  onLoadErrorCallback = () => {
    this.loadError = true;
  };

  getTotalMusicFiles(genre: Genre) {
    switch (genre) {
      case 'surprise me!':
        return 1;
      case 'classical':
        return 2;
      case 'jazz':
        return 2;
      case 'rock':
        return 1;
      case 'dance':
        return 1;
    }
  }

  checkIfAssetsAreLoaded(genre: Genre) {
    return this.musicFilesLoaded === this.getTotalMusicFiles(genre);
  }

  async waitForAssetsToLoad(genre: Genre) {
    return new Promise<void>((resolve, reject) => {
      this.loadMusicFiles(genre);
      const intervalId = setInterval(() => {
        if (this.checkIfAssetsAreLoaded(genre)) {
          clearInterval(intervalId);
          resolve();
          return;
        }
        if (this.loadError) {
          clearInterval(intervalId);
          reject('Failed to load some design assets.');
          return;
        }
      }, 200);
    });
  }

  create() {}

  override update(time: number, delta: number): void {}

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
          return this.currentClassicalBacktrackId;
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
          return this.currentClassicalTriggerId;
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
          return this.danceBacktrackId;
        } else {
          this.danceTriggerId = this.dance.play(`trigger${this.currentDanceTrigger}`);
          this.currentDanceTrigger += 1;
          if (this.currentDanceTrigger === 33) {
            this.currentDanceTrigger = 1;
          }
          return this.danceTriggerId;
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
          return this.rockBacktrackId;
        } else {
          this.rockTriggerId = this.rock.play(`rock${this.currentRockTrigger}`);
          this.currentRockTrigger += 1;
          if (this.currentRockTrigger === 17) {
            this.currentRockTrigger = 1;
          }
          return this.rockTriggerId;
        }
        break;
      case 'surprise me!':
        if (!this.surprise) {
          return;
        }
        if (type === 'backtrack') {
          console.log('No ambient backtrack');
          return null;
        } else {
          if (this.surprise.playing(this.ambientTriggerId)) {
            this.surprise.stop(this.ambientTriggerId);
          }
          this.ambientTriggerId = this.surprise.play(`ambient ${this.currentAmbientTrigger}`);
          this.currentAmbientTrigger += 1;
          if (this.currentAmbientTrigger === 17) {
            this.currentAmbientTrigger = 1;
          }
          return this.ambientTriggerId;
        }
        break;
      case 'jazz':
        if (type === 'backtrack') {
          if (!this.isConstantDrumPlaying()) {
            this.constantDrumId = this.jazzBacktrack.play('constantDrum');
          }
          return this.constantDrumId;
        } else {
          if (this.currentChord >= 9) {
            this.currentChord = 1;
          }
          console.log(`playing CHORD ${this.currentChord}`);
          const currentChordId = this.jazzTrigger.play(`Chord ${this.currentChord}`);
          this.currentChord += 1;

          return currentChordId;
        }
    }
  }

  stopBacktrack(genre: Genre) {
    switch (genre) {
      case 'classical':
        this.classicalBacktrack && this.classicalBacktrack.fade(100, 0, 5000);
        break;
      case 'dance':
        this.dance && this.dance.fade(100, 0, 5000);
        break;
      case 'rock':
        this.rock && this.rock.fade(100, 0, 500);
        break;
      case 'surprise me!':
        return;
      case 'jazz':
        this.jazzBacktrack && this.jazzBacktrack.fade(100, 0, 500);
    }
  }

  constantDrumId?: number;
  currentChord = 1;
  fadeDrums(
    from: number,
    to: number,
    duration: number,
    id: number = this.constantDrumId as number,
  ) {
    this.jazzBacktrack.fade(from, to, duration, id);
  }

  playNextChord() {
    if (this.currentChord >= 9) {
      this.currentChord = 1;
    }
    console.log(`playing CHORD ${this.currentChord}`);
    this.jazzTrigger.play(`Chord ${this.currentChord}`);
    this.currentChord += 1;
  }

  endConstantDrum() {
    // this.drums.fade(1.0, 0, 2, this.constantDrumId);
    this.jazzBacktrack.stop(this.constantDrumId);
    this.jazzBacktrack.play('endingDrum');
  }

  playConstantDrum() {
    if (!this.isConstantDrumPlaying()) {
      this.constantDrumId = this.jazzBacktrack.play('constantDrum');
    }
  }

  pauseConstantDrum() {
    this.jazzBacktrack.pause(this.constantDrumId);
  }

  isConstantDrumPlaying() {
    return this.jazzBacktrack.playing(this.constantDrumId);
  }
}
