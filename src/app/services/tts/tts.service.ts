import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { Activities } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { TtsPreloader } from './tts.preloader';

@Injectable({
  providedIn: 'root',
})
export class TtsService {
  private isTtsPlaying = false;
  private sound: Howl;
  private queue: string[] = [];
  private isFilesLoadedCountZero = 0;
  private isErrInPreloading = false;
  private cacheStore: {
    [key: number]: Howl;
  } = {};

  constructor(private ttsPreloaderService: TtsPreloader) {}

  stopTts() {
    if (this.sound) {
      this.sound.stop();
    }
    this.isTtsPlaying = false;
  }

  async tts(text: string | undefined, backtrack?: Howl) {
    backtrack && backtrack.volume(0.7);

    if (!text || environment.speedUpSession) return;

    console.log('adding to queue ', text, this.queue);
    this.queue.push(text);

    if (this.isTtsPlaying) {
      console.log("Couldn't play tts (because another tts is playing: ) ", text);

      backtrack && backtrack.volume(1);
      return;
    }
    this.isTtsPlaying = true;

    let currentText: string;
    if (this.queue.length > 0) {
      const firstElem = this.queue.shift();
      if (firstElem) {
        currentText = firstElem;
      }
    }

    const hashStr = this.cyrb53(text);
    const sound = this.cacheStore[hashStr];
    if (sound) {
      sound.play();

      // If TTS is in cache store, the execution will be ended here.
      backtrack && backtrack.volume(1);
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.queue.length) {
        resolve({});
      }

      this.sound = new Howl({
        src: [
          environment.apiEndpoint +
            '/speech/generate?text=' +
            encodeURIComponent(currentText as string),
        ],
        autoplay: true,
        html5: true,
        format: ['mpeg'],
        onplayerror: () => {
          console.log('Cannot play', text);
          this.isTtsPlaying = false;
          backtrack && backtrack.volume(1);
          reject();
        },
        onend: () => {
          console.log('Tts ended ', text);
          this.isTtsPlaying = false;
          if (this.queue.length > 0) {
            return this.tts(this.queue.shift());
          } else {
            backtrack && backtrack.volume(1);
            return resolve({});
          }
        },
      });
      this.sound.play();
    });
  }

  async preLoadTts(activity: Activities) {
    this.resetCache();
    return new Promise<void>((resolve, reject) => {
      const ttsTexts = this.ttsPreloaderService.getTtsToCache();
      if (!Object.keys(ttsTexts).includes(activity)) {
        reject('Activity not in TTS preloader');
        return;
      }

      this.isFilesLoadedCountZero = ttsTexts[activity].length;

      for (let i = 0; i < ttsTexts[activity].length; i++) {
        console.log(`preloading TTS: ${ttsTexts[activity][i]}`);
        this.cacheTts(ttsTexts[activity][i]);
      }

      const intervalId = setInterval(() => {
        if (this.isFilesLoadedCountZero === 0) {
          clearInterval(intervalId);
          resolve();
          return;
        }
        if (this.isErrInPreloading) {
          clearInterval(intervalId);
          reject('Failed to load some design assets.');
          return;
        }
      }, 200);
    });
  }

  private onLoadCallback = () => {
    this.isFilesLoadedCountZero -= 1;
  };

  private onLoadErrorCallback = () => {
    this.isErrInPreloading = true;
  };

  private resetCache() {
    this.cacheStore = {};
  }

  private cacheTts(text: string) {
    const hashStr = this.cyrb53(text);

    if (hashStr in this.cacheStore) return;

    this.cacheStore[hashStr] = new Howl({
      src: [
        environment.apiEndpoint + '/speech/generate?text=' + encodeURIComponent(text as string),
      ],
      autoplay: false,
      html5: true,
      format: ['mpeg'],
      onload: this.onLoadCallback,
      onloaderror: this.onLoadErrorCallback,
      onplayerror: () => {
        console.log('Cannot play', text);
        this.isTtsPlaying = false;
      },
      onend: () => {
        console.log('Tts ended ', text);
        this.isTtsPlaying = false;
        if (this.queue.length > 0) {
          return this.tts(this.queue.shift());
        }
        return;
      },
    });
  }

  // Credit where it's due: https://stackoverflow.com/a/52171480
  private cyrb53(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
}
