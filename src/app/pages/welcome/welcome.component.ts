import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { session } from 'src/app/store/actions/session.actions';
import { SessionService } from 'src/app/services/session/session.service';
import { SoundsService } from 'src/app/services/sounds/sounds.service';

type Message = {
  type: 'message' | 'announcement' | 'pre-session-survey' | 'select-genre' | 'tutorial';
  text?: string;
  timeout?: number;
  bg: string;
};

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  animations: [
    trigger('panelInOut', [
      transition('void => *', [style({ opacity: 0.1 }), animate(800)]),
      transition('* => void', [animate(800, style({ opacity: 0 }))]),
    ]),
    trigger('faceInOut', [
      transition('void => *', [
        style({
          opacity: 0.1,
          fontSize: '5rem',
          width: '100vw',
          height: '100vw',
        }),
        animate(800),
      ]),
      transition('* => void', [animate(400, style({ opacity: 0 }))]),
    ]),
    trigger('showHide', [
      state(
        'visible',
        style({
          opacity: 1,
        }),
      ),
      state(
        'hidden',
        style({
          opacity: 0,
        }),
      ),
      transition('visible => hidden', [animate('1s')]),
      transition('hidden => visible', [animate('1s')]),
      transition('void => *', [animate('1s')]),
    ]),
  ],
})
export class WelcomeComponent implements OnInit {
  messages: Array<Message> = [
    {
      type: 'message',
      text: 'Welcome back',
      timeout: 2000,
      bg: '#000066',
    },
    {
      type: 'message',
      text: 'Great to see you',
      timeout: 2000,
      bg: '#000066',
    },
    {
      type: 'announcement',
      text: `Let's Go`,
      timeout: 3000,
      bg: '#FFFFFF',
    },
    {
      type: 'pre-session-survey',
      text: 'How are you feeling today?',
      bg: '#FFB2B2',
    },
    {
      type: 'announcement',
      text: `Thanks`,
      timeout: 3000,
      bg: '#FFFFFF',
    },
    {
      type: 'select-genre',
      text: 'What type of music do you want to play?',
      bg: '#FFB000',
    },
    {
      type: 'announcement',
      text: `PERFECT`,
      timeout: 3000,
      bg: '#FFFFFF',
    },
    {
      type: 'tutorial',
      bg: '#000000',
      timeout: 275000, // length of video + some extra time
    },
  ];
  sessionId: string;

  currentStep = -1;
  currentMessage: Message | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private soundsService: SoundsService,
    private store: Store<{ session: any }>,
  ) {
    // Save the session id in the store
    // If there is no session id, then disable analytics
    this.sessionId =
      this.route.snapshot.queryParamMap.get('session') ||
      this.route.snapshot.queryParamMap.get('sessionId') ||
      '';
  }

  async ngOnInit() {
    // await this.initMessageSequence()
    if (this.sessionId) {
      const sessionData = await this.sessionService.get(this.sessionId);
      this.store.dispatch(session.updateConfig(sessionData.session_by_pk));
    }

    await this.showNextStep();
  }

  async showNextStep() {
    // await this.sleep(500)
    this.currentStep += 1;
    if (this.currentStep == this.messages.length) {
      // Last step is also done :D
      // Let the user play the game
      this.router.navigate(['session']);
    }
    if (this.messages[this.currentStep]) {
      this.currentMessage = this.messages[this.currentStep];
      this.currentMessage.bg = this.currentMessage.bg || '#000066';
      if (this.currentMessage.text) {
        this.soundsService.tts(this.currentMessage.text);
      }
      if (this.currentMessage.timeout) {
        // Blank out the page
        setTimeout(() => {
          this.currentMessage = undefined;
        }, this.currentMessage.timeout - 400);

        // Set the next message
        setTimeout(() => {
          this.showNextStep();
        }, this.currentMessage.timeout);
      }
    }
  }

  async sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({});
      }, timeout);
    });
  }

  async preSessionMoodSelected(mood: string) {
    await this.sessionService.updatePreSessionMood(mood);
    this.showNextStep();
  }

  async genreSelected(genre: string) {
    await this.sessionService.updateGenre(genre);
    this.showNextStep();
  }
}
