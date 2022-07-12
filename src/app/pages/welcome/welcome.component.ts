import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { session } from 'src/app/store/actions/session.actions';
import { SessionService } from 'src/app/services/session/session.service';
import { SoundsService } from 'src/app/services/sounds/sounds.service';
import { environment } from 'src/environments/environment';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import {
  ActivityStage,
  PreSessionGenre,
  PreSessionMood,
  SessionStateField,
} from 'src/app/types/pointmotion';
import { UserService } from 'src/app/services/user/user.service';
import { gql } from 'graphql-request';
import { AnalyticsService } from 'src/app/services/analytics/analytics.service';

type SessionDetails = { heading: string; checkList: string[]; text?: string };
type Message = {
  type:
    | 'session-start-confirmation'
    | 'message'
    | 'announcement'
    | 'pre-session-survey'
    | 'select-genre'
    | 'tutorial';
  sessionDetails?: SessionDetails;
  text?: string;
  timeout?: number;
  bg: string;
};

interface FetchUserSessionsResponse {
  session: {
    genre: PreSessionGenre;
    id: string;
    state: {
      stage: ActivityStage;
      currentActivity: {
        type: string;
        totalReps: number;
        repsCompleted: number;
      };
    };
  }[];
}

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
  chevronRightIcon = faChevronRight;
  messages: Array<Message> = [
    {
      type: 'session-start-confirmation',
      bg: '#000066',
      sessionDetails: {
        heading: 'Sit, Stand, Achieve',
        checkList: [
          'For this session you will require a CHAIR to perform certain activities.',
          'Make sure that only you are in front of the screen.',
          'Take periodic rests if you feel tired.',
          'Make sure you are in a space where you can move freely.',
        ],
      },
    },
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
  sessionId = 'bfce8d96-fd18-4fea-9097-cb3b01ee025a';
  intervalId: any;
  currentStep = -1;
  currentMessage: Message | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private soundsService: SoundsService,
    private userService: UserService,
    private store: Store<{ session: any }>,
    private analyticsService: AnalyticsService,
  ) {
    // Save the session id in the store
    // If there is no session id, then disable analytics
    this.sessionId =
      this.route.snapshot.queryParamMap.get('session') ||
      this.route.snapshot.queryParamMap.get('sessionId') ||
      '';
  }

  async ngOnInit() {
    // Ask the parent window to send a token... we're ready, well almost.
    window.parent.postMessage(
      {
        type: 'activity-experience-ready',
        data: {
          status: 'ready',
        },
      },
      '*',
    );

    // Handle the incoming token
    window.addEventListener(
      'message',
      (data) => {
        const tokenHandled = this.userService.handleToken(data);
        if (tokenHandled) {
          this.start();
        }
      },
      false,
    );

    if (this.route.snapshot.queryParamMap.get('debug')) {
      this.start();
    }
  }

  async start() {
    if (this.sessionId) {
      const sessionData = await this.sessionService.getSession(this.sessionId);
      console.log('sessionData', sessionData);
      this.store.dispatch(session.updateConfig(sessionData.session_by_pk));

      // if stage is present in session.state then we will skip the preSession and will proceed to the session directly.
      if (sessionData.session_by_pk.patient) {
        const currentDate = new Date(new Date().toISOString().split('T')[0]!);
        const futureDate = this.getFutureDate(currentDate, 1);

        const response: FetchUserSessionsResponse =
          await this.sessionService.getUserSessionsBetweenDates(
            sessionData.session_by_pk.patient,
            currentDate,
            futureDate,
          );
        console.log('existing session', response.session[0]);

        // getting genre from the previous sessions, so that even if a session starts from middle, we can play the selected genre.
        if (response.session[0] && response.session[0].genre) {
          this.store.dispatch(session.setGenre({ genre: response.session[0].genre }));
          this.sessionService.updateGenre(response.session[0].genre as PreSessionGenre);
        }
        if (response.session[0] && response.session[0].state && response.session[0].state.stage) {
          this.analyticsService.sendSessionState(response.session[0].state.stage as ActivityStage);
          this.store.dispatch(
            session.updateSessionState({
              stage: response.session[0].state.stage,
              currentActivity: response.session[0].state.currentActivity,
            }),
          );
          if (response.session[0].state.stage !== 'postGame') {
            this.router.navigate(['session']);
          }
        }
      }
    }
    await this.showNextStep();
  }

  async showNextStep() {
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

  async sessionStartConfirmation() {
    this.soundsService.playSessionStartSound();
    this.showNextStep();
  }

  async preSessionMoodSelected(mood: string | PreSessionMood) {
    await this.sessionService.updatePreSessionMood(mood as PreSessionMood);
    this.showNextStep();
  }

  async genreSelected(genre: string | PreSessionGenre) {
    await this.sessionService.updateGenre(genre as PreSessionGenre);
    this.showNextStep();
  }

  getFutureDate(currentDate: Date, numOfDaysInFuture: number) {
    return new Date(currentDate.getTime() + 86400000 * numOfDaysInFuture);
  }
}
