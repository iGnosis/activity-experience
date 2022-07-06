import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Howl } from 'howler';
import { Observable, retry } from 'rxjs';
import { PreSessionGenre, SessionState } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { JwtService } from '../jwt/jwt.service';

@Injectable({
  providedIn: 'root',
})
export class SoundsService {
  observable$: {
    genre$: Observable<string | undefined>;
  };
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

  activityInstructionSound: Howl = new Howl({
    src: 'assets/sounds/soundscapes/Sound Health Soundscape_Activity Instructions.mp3',
    html5: true,
    loop: true,
  });
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

  ambient: Howl;
  dance: Howl;
  rock: Howl;
  jazz: Howl;
  classicalBacktrack: Howl;
  classicalTrigger: Howl;
  loadMusicFiles(genre: PreSessionGenre) {
    switch (genre) {
      case 'Surprise Me!':
        this.ambient = new Howl({
          src: 'assets/sounds/soundsprites/ambient/ambientSprite.mp3',
          sprite: {
            'ambient 1': [0, 6295.510204081633],
            'ambient 2': [8000, 6295.510204081634],
            'ambient 3': [16000, 6295.510204081634],
            'ambient 4': [24000, 6295.510204081634],
            'ambient 5': [32000, 6295.51020408163],
            'ambient 6': [40000, 6295.51020408163],
            'ambient 7': [48000, 6295.51020408163],
            'ambient 8': [56000, 6295.51020408163],
            'ambient 9': [64000, 6295.510204081637],
            'ambient 10': [72000, 6295.510204081637],
            'ambient 11': [80000, 6295.510204081637],
            'ambient 12': [88000, 6295.510204081637],
            'ambient 13': [96000, 6295.510204081637],
            'ambient 14': [104000, 6295.510204081637],
            'ambient 15': [112000, 6295.510204081637],
            'ambient 16': [120000, 11284.897959183667],
          },
        });
        break;
      case 'Dance':
        this.dance = new Howl({
          src: 'assets/sounds/soundsprites/dance/danceSprite.mp3',
          sprite: {
            trigger1: [0, 3448.1632653061224],
            trigger2: [5000, 3448.163265306123],
            trigger3: [10000, 3448.163265306123],
            trigger4: [15000, 3448.163265306121],
            trigger5: [20000, 3448.163265306121],
            trigger6: [25000, 3448.163265306121],
            trigger7: [30000, 3448.163265306121],
            trigger8: [35000, 3448.163265306121],
            trigger9: [40000, 3448.163265306121],
            trigger10: [45000, 3448.163265306121],
            trigger11: [50000, 3448.163265306121],
            trigger12: [55000, 3448.163265306121],
            trigger13: [60000, 3448.163265306121],
            trigger14: [65000, 3448.163265306121],
            trigger15: [70000, 3448.163265306121],
            trigger16: [75000, 3448.163265306121],
            trigger17: [80000, 3448.163265306121],
            trigger18: [85000, 3448.163265306121],
            trigger19: [90000, 3448.163265306121],
            trigger20: [95000, 3448.163265306121],
            trigger21: [100000, 3448.163265306121],
            trigger22: [105000, 3448.163265306121],
            trigger23: [110000, 3448.163265306121],
            trigger24: [115000, 3448.163265306121],
            trigger25: [120000, 3448.163265306121],
            trigger26: [125000, 3448.163265306135],
            trigger27: [130000, 3448.163265306135],
            trigger28: [135000, 3448.163265306135],
            trigger29: [140000, 3448.163265306135],
            trigger30: [145000, 3448.163265306135],
            trigger31: [150000, 3448.163265306135],
            trigger32: [155000, 3448.163265306135],
            backtrack: [160000, 108225.30612244895, true],
          },
        });
        break;
      case 'Rock':
        this.rock = new Howl({
          src: 'assets/sounds/soundsprites/rock/rockSprite.mp3',
          sprite: {
            rock1: [0, 3186.9387755102043],
            rock2: [5000, 3186.9387755102034],
            rock3: [10000, 3186.9387755102034],
            rock4: [15000, 3186.9387755102034],
            rock5: [20000, 3186.9387755102034],
            rock6: [25000, 3186.9387755102034],
            rock7: [30000, 3186.9387755102066],
            rock8: [35000, 3186.9387755102066],
            rock9: [40000, 3186.9387755102066],
            rock10: [45000, 3186.9387755102066],
            rock11: [50000, 3186.9387755102066],
            rock12: [55000, 3186.9387755102066],
            rock13: [60000, 3186.9387755102066],
            rock14: [65000, 3186.9387755102],
            rock15: [70000, 3186.9387755102],
            rock16: [75000, 3186.9387755102],
            backtrack: [80000, 56137.14285714286, true],
          },
        });
        break;
      case 'Classical':
        this.classicalBacktrack = new Howl({
          src: 'assets/sounds/soundsprites/classical/classicalSprite.mp3',
          sprite: {
            'backtrack set1': [64000, 62275.918367346945, true],
            'backtrack set2': [128000, 53394.28571428573, true],
            'backtrack set3': [0, 62275.91836734694, true],
          },
        });

        this.classicalTrigger = new Howl({
          src: 'assets/sounds/soundsprites/classical/classicalSprite.mp3',
          sprite: {
            set1rep1: [183000, 4519.183673469399, true],
            set1rep2: [189000, 4519.183673469399, true],
            set1rep3: [195000, 4519.183673469399, true],
            set1rep4: [201000, 4519.183673469399, true],
            set1rep5: [207000, 4519.183673469399, true],
            set1rep6: [213000, 4519.183673469399, true],
            set1rep7: [219000, 4519.183673469399, true],
            set1rep8: [225000, 4519.183673469399, true],
            set1rep9: [231000, 4519.183673469399, true],
            set1rep10: [237000, 4519.183673469399, true],
            set1rep11: [243000, 4519.183673469399, true],
            set1rep12: [249000, 4519.183673469399, true],
            set2rep1: [255000, 4519.183673469399, true],
            set2rep2: [261000, 4519.183673469399, true],
            set2rep3: [267000, 4519.183673469399, true],
            set2rep4: [273000, 4519.183673469399, true],
            set2rep5: [279000, 4519.183673469399, true],
            set2rep6: [285000, 4519.183673469399, true],
            set2rep7: [291000, 4519.183673469399, true],
            set2rep8: [297000, 4519.183673469399, true],
            set2rep9: [303000, 4519.183673469399, true],
            set2rep10: [309000, 4519.183673469399, true],
            set2rep11: [315000, 4519.183673469399, true],
            set2rep12: [321000, 4519.183673469399, true],
            set3rep1: [357000, 4519.183673469399, true],
            set3rep2: [363000, 4519.183673469399, true],
            set3rep3: [369000, 4519.183673469399, true],
            set3rep4: [375000, 4519.183673469399, true],
            set3rep5: [381000, 4519.183673469399, true],
            set3rep6: [387000, 4519.183673469399, true],
            set3rep7: [393000, 4519.183673469399, true],
            set3rep8: [399000, 4519.183673469399, true],
            set3rep9: [405000, 4519.183673469399, true],
            set3rep10: [327000, 4519.183673469399, true],
            set3rep11: [333000, 4519.183673469399, true],
            set3rep12: [339000, 4519.183673469399, true],
            set3rep13: [345000, 4519.183673469399, true],
            set3rep14: [351000, 4519.183673469399, true],
          },
        });
        break;
      case 'Jazz':
        break;
    }
  }

  classicTriggerFadeoutDuration = 4519.183673469399 - 3000;
  isBacktrackPlaying(genre: PreSessionGenre) {
    switch (genre) {
      case 'Classical':
        if (this.currentClassicalBacktrackId) {
          return this.classicalBacktrack.playing(this.currentClassicalBacktrackId);
        }
        return false;
      case 'Dance':
        if (this.danceBacktrackId) {
          return this.dance.playing(this.danceBacktrackId);
        }
        return false;
      case 'Rock':
        if (this.rockBacktrackId) {
          return this.rock.playing(this.rockBacktrackId);
        }
        return false;
      case 'Surprise Me!':
        return false;
      case 'Jazz':
        return this.isConstantDrumPlaying();
      default:
        return false;
    }
  }

  pauseBacktrack(genre: PreSessionGenre) {
    switch (genre) {
      case 'Classical':
        if (
          this.currentClassicalBacktrackId &&
          this.classicalBacktrack.playing(this.currentClassicalBacktrackId)
        ) {
          this.classicalBacktrack.pause(this.currentClassicalBacktrackId);
        }
        break;
      case 'Dance':
        if (this.danceBacktrackId && this.dance.playing(this.danceBacktrackId)) {
          this.dance.pause(this.danceBacktrackId);
        }
        break;
      case 'Rock':
        if (this.rockBacktrackId && this.rock.playing(this.rockBacktrackId)) {
          this.rock.pause(this.rockBacktrackId);
        }
        break;
      case 'Surprise Me!':
        return;
      case 'Jazz':
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
  playMusic(genre: PreSessionGenre, type: 'backtrack' | 'trigger') {
    switch (genre) {
      case 'Classical':
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
      case 'Dance':
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
      case 'Rock':
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
      case 'Surprise Me!':
        if (!this.ambient) {
          return;
        }
        if (type === 'backtrack') {
          console.log('No ambient backtrack');
          return;
        } else {
          if (this.ambient.playing(this.ambientTriggerId)) {
            this.ambient.stop(this.ambientTriggerId);
          }
          this.ambientTriggerId = this.ambient.play(`ambient ${this.currentAmbientTrigger}`);
          this.currentAmbientTrigger += 1;
          if (this.currentAmbientTrigger === 17) {
            this.currentAmbientTrigger = 1;
          }
        }
        break;
      case 'Jazz':
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

  playGenreSound(genre: PreSessionGenre) {
    if (this.preSessionMoodSound.playing()) {
      this.preSessionMoodSound.stop();
    }
    switch (genre) {
      case 'Classical':
        if (!this.preSessionGenreClassic.playing(this.preSessionGenreClassicId)) {
          this.preSessionGenreClassicId = this.preSessionGenreClassic
            .fade(0, 80, 3000, this.preSessionGenreClassicId)
            .play();
        }
        break;
      case 'Jazz':
        if (!this.preSessionGenreJazz.playing(this.preSessionGenreJazzId)) {
          this.preSessionGenreJazzId = this.preSessionGenreJazz.fade(0, 80, 3000).play();
        }
        break;
      case 'Rock':
        if (!this.preSessionGenreRock.playing(this.preSessionGenreRockId)) {
          this.preSessionGenreRockId = this.preSessionGenreRock.fade(0, 80, 3000).play();
        }
        break;
      case 'Dance':
        if (!this.preSessionGenreDance.playing(this.preSessionGenreDanceId)) {
          this.preSessionGenreDanceId = this.preSessionGenreDance.fade(0, 80, 3000).play();
        }
        break;
      case 'Surprise Me!':
        if (!this.preSessionGenreSurprise.playing(this.preSessionGenreSurpriseId)) {
          this.preSessionGenreSurpriseId = this.preSessionGenreSurprise.fade(0, 80, 3000).play();
        }
        break;
    }
  }

  stopGenreSound(genre?: PreSessionGenre) {
    Howler.stop();
  }

  playActivityInstructionSound() {
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
}
