import { Injectable } from '@angular/core';
import { Genre } from 'src/app/types/pointmotion';
import { Howl } from 'howler';
import { audioSprites } from 'src/app/services/sounds/audio-sprites';
import { TtsService } from 'src/app/services/tts/tts.service';

enum TextureKeys {
  XP_COIN = 'xp_coin',
}
@Injectable({
  providedIn: 'root',
})
export class SitToStandScene extends Phaser.Scene {
  musicFilesLoaded = 0;
  loadError = false;

  constructor(private ttsService: TtsService) {
    super({ key: 'sit2stand' });
  }

  private surprise: Howl;
  private dance: Howl;
  private rock: Howl;
  private jazz: Howl;
  private classical: Howl;
  private music = false;
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
  currentTrigger = 1;
  currentClassicalRep = 1;
  currentClassicalSet = 1;
  designAssetsLoaded = false;

  preload() {
    this.load.image({
      key: TextureKeys.XP_COIN,
      url: 'assets/images/xp_coin.png',
    });

    this.load.once('complete', (_id: number, _completed: number, failed: number) => {
      if (failed === 0) {
        this.designAssetsLoaded = true;
      } else {
        console.log('Design Assets Failed to Load', failed);
        this.loadError = true;
      }
    });
  }

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
    return this.musicFilesLoaded === 1 && this.designAssetsLoaded;
  }

  async loadAssets(genre: Genre) {
    await this.ttsService.preLoadTts('sit_stand_achieve');
    return new Promise<void>((resolve, reject) => {
      const startTime = new Date().getTime();

      // as afro music is unavailable, we are using classical music for afro.
      if (this.musicFilesLoaded === 0) {
        if ((genre as Genre | 'afro') === 'afro') {
          this.loadMusicFiles('jazz');
        } else {
          this.loadMusicFiles(genre);
        }
      }

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
        if (
          this.classical &&
          this.classicalBacktrackId &&
          this.classical.playing(this.classicalBacktrackId)
        ) {
          this.classical.pause(this.classicalBacktrackId);
        }
        break;
      case 'dance':
        if (this.dance && this.danceBacktrackId && this.dance.playing(this.danceBacktrackId)) {
          this.dance.pause(this.danceBacktrackId);
        }
        break;
      case 'rock':
        if (this.rock && this.rockBacktrackId && this.rock.playing(this.rockBacktrackId)) {
          this.rock.pause(this.rockBacktrackId);
        }
        break;
      case 'surprise me!':
        if (
          this.surprise &&
          this.surpriseBacktrackId &&
          this.surprise.playing(this.surpriseBacktrackId)
        ) {
          this.surprise.pause(this.surpriseBacktrackId);
        }
        break;
      case 'jazz':
      default:
        if (this.jazz && this.jazzBacktrackId && this.jazz.playing(this.jazzBacktrackId)) {
          this.jazz.pause(this.jazzBacktrackId);
        }
        break;
    }
  }

  getBacktrack(genre: Genre): Howl {
    switch (genre) {
      case 'classical':
        return this.classical;
      case 'dance':
        return this.dance;
      case 'rock':
        return this.rock;
      case 'surprise me!':
        return this.surprise;
      case 'jazz':
        return this.jazz;
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
      default:
        return this.jazz.playing(this.jazzBacktrackId);
    }
  }

  playBacktrack(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (this.currentSet === 0) {
          if (this.classical && !this.classical.playing(this.classicalBacktrackId)) {
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          }
          return this.classicalBacktrackId;
        } else {
          if (this.classical && !this.classical.playing(this.classicalBacktrackId)) {
            this.classicalBacktrackId = this.classical.play('classicalBacktrack');
          }
          return this.classicalBacktrackId;
        }
      case 'dance':
        if (this.dance && !this.dance.playing(this.danceBacktrackId)) {
          this.danceBacktrackId = this.dance.play('danceBacktrack');
        }
        return this.danceBacktrackId;
      case 'rock':
        if (this.rock && !this.rock.playing(this.rockBacktrackId)) {
          this.rockBacktrackId = this.rock.play('rockBacktrack');
        }
        return this.rockBacktrackId;
      case 'surprise me!':
        if (this.surprise && !this.surprise.playing(this.surpriseBacktrackId)) {
          this.surpriseBacktrackId = this.surprise.play('ambientBacktrack');
        }
        return this.surpriseBacktrackId;
      case 'jazz':
      default:
        if (this.jazz && !this.jazz.playing(this.jazzBacktrackId)) {
          this.jazzBacktrackId = this.jazz.play('jazzBacktrack');
        }
        return this.jazzBacktrackId;
    }
  }

  playTrigger(genre: Genre) {
    switch (genre) {
      case 'classical':
        if (!this.classical) return;
        // to fade we need to know duration to fade. All the triggers have the same duration.
        const classicTriggerFadeoutDuration = 1519.183673469399;

        /**
         * Classical set0 is a bit different than the rest of the music sets in SSA.
         * It has 3 sub-sets, each sub-set has 1 backtrack. sub-set 1 and 2 has 12 triggers, but sub-set 3 has 14 triggers.
         * first, the sub-set 1 backtrack is played in the background.. for every right movement the user makes, a trigger will be played.
         * when all the triggers from sub-set-1 are finished, then sub-set 1 backtrack will be replaced with sub-set 2 backtrack.
         * from now, a trigger from sub-set 2 will be played for right movements.. similarly it moves to sub-set 3.
         */
        if (this.currentSet === 0) {
          const soundTrackKey = `set${this.currentClassicalSet}classical${this.currentClassicalRep}`;
          if (this.classicalTriggerId && this.classical.playing(this.classicalTriggerId)) {
            this.classical.stop(this.classicalTriggerId);
          }
          this.classical.volume(0.7, this.classicalTriggerId);
          this.classicalTriggerId = this.classical.play(soundTrackKey);
          this.classical.fade(0, 0.7, 1500, this.classicalTriggerId);
          setTimeout(() => {
            this.classical.fade(0.7, 0, classicTriggerFadeoutDuration, this.classicalTriggerId);
          }, 1500);
          this.currentClassicalRep += 1;
          if (this.currentClassicalSet === 1 && this.currentClassicalRep === 12) {
            this.currentClassicalSet = 2;
            this.currentClassicalRep = 1;
            if (this.classical.playing(this.classicalBacktrackId)) {
              this.classical.stop(this.classicalBacktrackId);
            }
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          } else if (this.currentClassicalSet === 2 && this.currentClassicalRep === 12) {
            this.currentClassicalSet = 3;
            this.currentClassicalRep = 1;
            if (this.classical.playing(this.classicalBacktrackId)) {
              this.classical.stop(this.classicalBacktrackId);
            }
            this.classicalBacktrackId = this.classical.play(
              `classicalBacktrack${this.currentClassicalSet}`,
            );
          } else if (this.currentClassicalSet === 3 && this.currentClassicalRep === 14) {
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
        if (!this.dance) return;
        this.danceTriggerId = this.dance.play(`dance${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.danceTriggerId;
      case 'rock':
        if (!this.rock) return;
        this.rockTriggerId = this.rock.play(`rock${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.rockTriggerId;
      case 'surprise me!':
        if (!this.surprise) return;
        this.surpriseTriggerId = this.surprise.play(`ambient${this.currentTrigger}`);
        this.currentTrigger += 1;
        if (this.currentTrigger === 10) {
          this.currentTrigger = 1;
        }
        return this.surpriseTriggerId;
      case 'jazz':
      default:
        if (!this.jazz) return;
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
        this.classical &&
          this.classical
            .fade(100, 0, endFadeoutDuration, this.classicalBacktrackId)
            .on('fade', (id) => {
              this.classical.stop(id);
            });
        break;
      case 'dance':
        this.dance &&
          this.dance.fade(100, 0, endFadeoutDuration, this.danceBacktrackId).on('fade', (id) => {
            this.dance.stop(id);
          });
        break;
      case 'rock':
        this.rock &&
          this.rock.fade(100, 0, endFadeoutDuration, this.rockBacktrackId).on('fade', (id) => {
            this.rock.stop(id);
          });
        break;
      case 'surprise me!':
        this.surprise &&
          this.surprise
            .fade(100, 0, endFadeoutDuration, this.surpriseBacktrackId)
            .on('fade', (id) => {
              this.surprise.stop(id);
            });
        return;
      case 'jazz':
      default:
        this.jazz &&
          this.jazz.fade(100, 0, endFadeoutDuration, this.jazzBacktrackId).on('fade', (id) => {
            this.jazz.stop(id);
          });
        return;
    }
  }

  animateScore(coins = 1) {
    const { width, height } = this.scale;
    const container = this.add.container((width * 70) / 100, height / 2);
    container.setSize(64, 64);
    const img = this.add.sprite(0, 0, TextureKeys.XP_COIN).setOrigin(0.5).setScale(0.06);
    const text = this.add.text(32, -16, '+' + coins, {
      font: '32px',
      color: '#FFEF5E',
    });

    const gradient = text.context.createLinearGradient(0, 0, 0, text.height);
    gradient.addColorStop(0, '#FFEF5E');
    gradient.addColorStop(1, '#F7936F');
    text.setFill(gradient);

    container.add([img, text]);

    this.tweens.addCounter({
      from: 1.1,
      to: 1,
      duration: 250,
      onUpdate: (tw) => {
        container.setScale(tw.getValue());
      },
      onComplete: () => {
        // this.tweens.addCounter({
        //   from: 1,
        //   to: 1.1,
        //   duration: 250,
        //   onUpdate: (tw) => {
        //     container.setScale(tw.getValue());
        //   },
        // });
        this.tweens.add({
          targets: [container],
          delay: 500,
          duration: 250,
          alpha: 0,
          onComplete: () => {
            container.destroy();
          },
        });
      },
    });
  }

  enableMusic(value = true) {
    this.music = value;

    // if disabled... unload music files

    // Commenting this for now.. as unloading music is causing the fade out to stop abruptly
    // if (!value) {
    //   this.surprise && this.surprise.unload();
    //   this.classical && this.classical.unload();
    //   this.dance && this.dance.unload();
    //   this.rock && this.rock.unload();
    //   this.jazz && this.jazz.unload();
    // }
  }
}
