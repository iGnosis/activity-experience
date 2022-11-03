import { Injectable } from '@angular/core';
import { Genre } from 'src/app/types/pointmotion';
import { Howl } from 'howler';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';
import { AudioSprite } from 'src/app/types/pointmotion';
import { TtsService } from 'src/app/services/tts/tts.service';

@Injectable({
  providedIn: 'root',
})
export class SitToStandScene extends Phaser.Scene {
  musicFilesLoaded = 0;
  loadError = false;

  constructor(private ttsService: TtsService) {
    super({ key: 'sit2stand' });
  }

  surprise: Howl;
  dance: Howl;
  rock: Howl;
  jazz: Howl;
  classical: Howl;
  classicalBacktrackId!: number;
  danceBacktrackId!: number;
  rockBacktrackId!: number;
  surpriseBacktrackId!: number;
  jazzBacktrackId!: number;
  classicalTriggerId!: number;
  danceTriggerId!: number;
  rockTriggerId!: number;
  surpriseTriggerId!: number;
  jazzTriggerId!: number;

  currentSet!: number;

  preload() {}

  src: { [key in Genre]: string[] } = {
    classical: [
      'assets/sounds/soundsprites/sit-stand-achieve/classical/set1/classical-set1.mp3',
      'assets/sounds/soundsprites/sit-stand-achieve/classical/set2/classical-set2.mp3',
    ],
    jazz: [
      'assets/sounds/soundsprites/sit-stand-achieve/jazz/set1/jazz-set1.mp3',
      'assets/sounds/soundsprites/sit-stand-achieve/jazz/set2/jazz-set2.mp3',
    ],
    dance: [
      'assets/sounds/soundsprites/sit-stand-achieve/dance/set1/dance-set1.mp3',
      'assets/sounds/soundsprites/sit-stand-achieve/dance/set2/dance-set2.mp3',
    ],
    rock: [
      'assets/sounds/soundsprites/sit-stand-achieve/rock/set1/rock-set1.mp3',
      'assets/sounds/soundsprites/sit-stand-achieve/rock/set2/rock-set2.mp3',
    ],
    'surprise me!': [
      'assets/sounds/soundsprites/sit-stand-achieve/ambient/set1/ambient-set1.mp3',
      'assets/sounds/soundsprites/sit-stand-achieve/ambient/set2/ambient-set2.mp3',
    ],
  };

  loadMusicFiles(genre: Genre) {
    console.log('loading ', genre, ' files');

    const randomSet = Math.floor(Math.random() * 2);
    this.currentSet = randomSet;
    const src = this.src[genre][randomSet];

    switch (genre) {
      case 'surprise me!':
        this.surprise = new Howl({
          src,
          sprite: audioSprites.ambientSprite[randomSet],
          html5: true,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'dance':
        this.dance = new Howl({
          src,
          sprite: audioSprites.danceSprite[randomSet],
          html5: true,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'rock':
        this.rock = new Howl({
          src,
          sprite: audioSprites.rockSprite[randomSet],
          html5: true,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'classical':
        this.classical = new Howl({
          src,
          sprite: audioSprites.classicalSprite[randomSet],
          html5: true,
          onload: this.onLoadCallback,
          onloaderror: this.onLoadErrorCallback,
        });
        break;
      case 'jazz':
        this.jazz = new Howl({
          src,
          sprite: audioSprites.jazzSprite[randomSet],
          html5: true,
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

  checkIfAssetsAreLoaded(genre: Genre) {
    return this.musicFilesLoaded === 1;
  }

  async loadAssets(genre: Genre) {
    await this.ttsService.preLoadTts('sit_stand_achieve');
    return new Promise<void>((resolve, reject) => {
      const startTime = new Date().getTime();
      this.loadMusicFiles(genre);
      const intervalId = setInterval(() => {
        if (this.checkIfAssetsAreLoaded(genre) && new Date().getTime() - startTime >= 2500) {
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
        if (this.classicalBacktrackId && this.classical.playing(this.classicalBacktrackId)) {
          this.classical.pause(this.classicalBacktrackId);
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
        if (this.surpriseBacktrackId && this.surprise.playing(this.surpriseBacktrackId)) {
          this.surprise.pause(this.surpriseBacktrackId);
        }
        break;
      case 'jazz':
        if (this.jazzBacktrackId && this.jazz.playing(this.jazzBacktrackId)) {
          this.jazz.pause(this.jazzBacktrackId);
        }
        break;
    }
  }

  isBacktrackPlaying(genre: Genre) {
    switch (genre) {
      case 'classical':
        return this.classical.playing(this.classicalBacktrackId);
      case 'dance':
        return this.dance.playing(this.danceBacktrackId);
      case 'rock':
        return this.rock.playing(this.rockBacktrackId);
      case 'surprise me!':
        return this.surprise.playing(this.surpriseBacktrackId);
      case 'jazz':
        return this.jazz.playing(this.jazzBacktrackId);
    }
  }

  playBacktrack(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (this.currentSet === 0) {
          if (!this.classical.playing(this.classicalBacktrackId)) {
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          }
          return this.classicalBacktrackId;
        } else {
          if (!this.classical.playing(this.classicalBacktrackId)) {
            this.classicalBacktrackId = this.classical.play('classicalBacktrack');
          }
          return this.classicalBacktrackId;
        }
      case 'dance':
        if (!this.dance.playing(this.danceBacktrackId)) {
          this.danceBacktrackId = this.dance.play('danceBacktrack');
        }
        return this.danceBacktrackId;
      case 'rock':
        if (!this.rock.playing(this.rockBacktrackId)) {
          this.rockBacktrackId = this.rock.play('rockBacktrack');
        }
        return this.rockBacktrackId;
      case 'surprise me!':
        if (!this.surprise.playing(this.surpriseBacktrackId)) {
          this.surpriseBacktrackId = this.surprise.play('ambientBacktrack');
        }
        return this.surpriseBacktrackId;
      case 'jazz':
        if (!this.jazz.playing(this.jazzBacktrackId)) {
          this.jazzBacktrackId = this.jazz.play('jazzBacktrack');
        }
        return this.jazzBacktrackId;
    }
  }

  currentTrigger = 1;
  currentClassicalRep = 1;
  currentClassicalSet = 1;
  classicTriggerFadeoutDuration = 4519.183673469399 - 3000;

  playTrigger(genre: Genre) {
    switch (genre) {
      case 'classical':
        // classical set 0 has weird music logic
        if (this.currentSet === 0) {
          console.log(`playing set${this.currentClassicalSet}rep${this.currentClassicalRep}`);
          const soundTrackKey = `set${this.currentClassicalSet}classical${this.currentClassicalRep}`;
          if (this.classicalTriggerId && this.classical.playing(this.classicalTriggerId)) {
            this.classical.stop(this.classicalTriggerId);
          }
          this.classical.volume(0.7, this.classicalTriggerId);
          this.classicalTriggerId = this.classical.play(soundTrackKey);
          this.classical.fade(0, 0.7, 1500, this.classicalTriggerId);
          setTimeout(() => {
            this.classical.fade(
              0.7,
              0,
              this.classicTriggerFadeoutDuration,
              this.classicalTriggerId,
            );
          }, 1500);
          this.currentClassicalRep += 1;
          if (this.currentClassicalSet === 1 && this.currentClassicalRep === 12) {
            console.log('set 1 ended, starting set 2, resetting reps to 0');
            this.currentClassicalSet = 2;
            this.currentClassicalRep = 1;
            if (this.classical.playing(this.classicalBacktrackId)) {
              this.classical.stop(this.classicalBacktrackId);
            }
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          } else if (this.currentClassicalSet === 2 && this.currentClassicalRep === 12) {
            console.log('set 2 ended, starting set 3, resetting reps to 0');
            this.currentClassicalSet = 3;
            this.currentClassicalRep = 1;
            if (this.classical.playing(this.classicalBacktrackId)) {
              this.classical.stop(this.classicalBacktrackId);
            }
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          } else if (this.currentClassicalSet === 3 && this.currentClassicalRep === 14) {
            console.log('set 3 ended, starting set 1, resetting reps to 0');
            this.currentClassicalSet = 1;
            this.currentClassicalRep = 1;
            if (this.classical.playing(this.classicalBacktrackId)) {
              this.classical.stop(this.classicalBacktrackId);
            }
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          }
          return this.classicalTriggerId;
        } else {
          this.classicalTriggerId = this.classical.play(`classical${this.currentTrigger}`);
          this.currentTrigger += 1;
          if (this.currentTrigger === 10) {
            this.currentTrigger = 1;
          }
          return this.classicalTriggerId;
        }
      case 'dance':
        this.danceTriggerId = this.dance.play(`dance${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.danceTriggerId;
      case 'rock':
        this.rockTriggerId = this.rock.play(`rock${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.rockTriggerId;
      case 'surprise me!':
        this.surpriseTriggerId = this.surprise.play(`ambient${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.surpriseTriggerId;
      case 'jazz':
        this.jazzTriggerId = this.jazz.play(`jazz${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.jazzTriggerId;
    }
  }

  stopBacktrack(genre: Genre) {
    const endFadeoutDuration = 5000;
    switch (genre) {
      case 'classical':
        this.classical && this.classical.fade(100, 0, endFadeoutDuration);
        break;
      case 'dance':
        this.dance && this.dance.fade(100, 0, endFadeoutDuration);
        break;
      case 'rock':
        this.rock && this.rock.fade(100, 0, endFadeoutDuration);
        break;
      case 'surprise me!':
        this.surprise && this.surprise.fade(100, 0, endFadeoutDuration);
        return;
      case 'jazz':
        this.jazz && this.jazz.fade(100, 0, endFadeoutDuration);
    }
  }
}
