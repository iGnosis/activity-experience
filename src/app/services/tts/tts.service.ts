import { Injectable } from '@angular/core';
import { Howl } from 'howler';
import { environment } from 'src/environments/environment';
import { JwtService } from '../jwt/jwt.service';

@Injectable({
  providedIn: 'root',
})
export class TtsService {
  private isTtsPlaying = false;
  private sound: Howl;
  constructor(private jwtService: JwtService) {}

  tts(text: string, speaker = 'mila') {
    if (environment.speedUpSession) return;
    console.log('isTtsPlaying ', this.isTtsPlaying);
    if (this.isTtsPlaying) {
      console.log("Couldn't play tts (because another tts is playing: ) ", text);
      return;
    }
    this.isTtsPlaying = true;
    const requestHeaders = new Headers();
    requestHeaders.set('Authorization', `Bearer ${this.jwtService.getToken()!}`);

    const reqUrl = environment.apiEndpoint + '/speech/generate?text=' + encodeURIComponent(text);
    fetch(reqUrl, {
      headers: requestHeaders,
    })
      .then((reqUrl) => reqUrl.blob())
      .then((data) => {
        const blob = new Blob([data], { type: 'audio/mpeg' });
        const objectUrl = URL.createObjectURL(blob);
        this.sound = new Howl({
          src: objectUrl,
          autoplay: true,
          html5: true,
          format: ['mpeg'],
          onplayerror: () => {
            console.log('Cannot play', text);
            this.isTtsPlaying = false;
          },
          onend: () => {
            console.log('Tts ended ', text);
            this.isTtsPlaying = false;
          },
        });
        this.sound.play();
      });
  }

  stopTts() {
    if (this.sound) {
      this.sound.stop();
    }
  }
}
