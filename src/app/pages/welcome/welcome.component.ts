import { Component, OnInit } from '@angular/core';
import {  Store } from '@ngrx/store';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { session } from 'src/app/store/actions/session.actions';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  animations: [
    trigger('panelInOut', [
      transition('void => *', [
          style({opacity: 0.1}),
          animate(800)
      ]),
      transition('* => void', [
          animate(800, style({opacity: 0}))
      ])
    ]),
    trigger('faceInOut', [
      transition('void => *', [
          style({opacity: 0.1, fontSize: '5rem', width: '100vw', height: '100vw'}),
          animate(800)
      ]),
      transition('* => void', [
          animate(400, style({opacity: 0}))
      ])
    ]),
    trigger('showHide', [
      state('visible', style({
        opacity: 1,
      })),
      state('hidden', style({
        opacity: 0
      })),
      transition('visible => hidden', [
        animate('1s')
      ]),
      transition('hidden => visible', [
        animate('1s')
      ]),
      transition('void => *', [
        animate('1s')
      ]),
    ])
  ]
})
export class WelcomeComponent implements OnInit {

  
  messages = [
    {
      type: 'message',
      text: 'Welcome back',
      timeout: 2000,
      bg: '#000066'
    }, {
      type: 'message',
      text: 'Great to see you',
      timeout: 2000,
      bg: '#000066'
    }, 
    {
      type: 'announcement',
      text: `Let's Go`,
      timeout: 3000,
      bg: '#FFFFFF'
    }, 
    {
      type: 'pre-session-survey',
      bg: '#FFB2B2'
    }, 
    {
      type: 'announcement',
      text: `Thanks`,
      timeout: 3000,
      bg: '#FFFFFF'
    }, {
      type: 'select-genre',
      bg: '#FFB000'
    }, {
      type: 'announcement',
      text: `PERFECT`,
      timeout: 3000,
      bg: '#FFFFFF'
    }
  ]

  currentStep = -1
  currentMessage: {type: string, text?: string, timeout?: number, bg: string} | undefined

  constructor(
    private route: ActivatedRoute,
    private store: Store<{session: any}>
  ) {
    // Save the session id in the store
    // If there is no session id, then disable analytics
    const sessionId = this.route.snapshot.queryParamMap.get('session') || this.route.snapshot.queryParamMap.get('sessionId') || ''
    let enableAnalytics = sessionId? true : false
    this.store.dispatch(session.updateConfig({sessionId, enableAnalytics}))

    if (!enableAnalytics) {
      this.messages.push({
        type: 'message',
        text: 'This session is NOT being recorded',
        timeout: 3000,
        bg: '#000066'
      })
    }
  }

  async ngOnInit() {
    // await this.initMessageSequence()
    await this.showNextStep()
  }

  async showNextStep() {
    // await this.sleep(500)
    this.currentStep += 1
    if(this.currentStep == this.messages.length - 1) {
      // Last step is also done :D 
      // Let the user play the game

    }
    this.currentMessage = this.messages[this.currentStep]
    this.currentMessage.bg = this.currentMessage.bg || '#000066'
    if (this.currentMessage.timeout) {
      // Blank out the page
      setTimeout(() => {
        this.currentMessage = undefined
      }, this.currentMessage.timeout - 400)

      // Set the next message
      setTimeout(() => {
        this.showNextStep()
      }, this.currentMessage.timeout)
    }
  }

  async initMessageSequence() {
    for(let i = 0; i < this.messages.length; i++) {
      this.currentMessage = this.messages[i]
      this.currentMessage.bg = this.currentMessage.bg || '#000066'
      console.log(this.currentMessage)
      
      // await this.sleep(this.currentMessage.timeout - 1000) // Keep 1s for the fadeout animation
      this.currentMessage = undefined
      await this.sleep(1000)
    }
  }

  async sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({})
      }, timeout)
    })
  }
}
