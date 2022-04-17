import { Injectable } from '@angular/core';
import { GuideAvatarDTO, GuideState } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root'
})
export class GuideService {

  constructor() { }

  getAvatarPosition(avatar: GuideAvatarDTO | undefined, avatarElm: HTMLElement, messageCenter: HTMLElement, messageBottom: HTMLElement) {
    if(messageCenter && messageBottom) {
      throw new Error('System error. Why do we have messageCenter && messageBottom both present???')
    } 

    if (!avatarElm) {
      return {
        left: 0,
        top: 'calc(100vh - 300px)'
      }
    }

    let avatarRect = avatarElm.getBoundingClientRect()

    if (messageBottom) {
      let msgRect = messageBottom.getBoundingClientRect()
      // the vertical centers of both the message box and avatar should be same
      // this.avatar.nativeElement.style.top = 
      const top = (msgRect.y + (msgRect.height/2) - (avatarRect.height/2)) + 'px'
      return {
        top, left: 0
      }
    } else if (messageCenter) {
      let msgRect = messageCenter.getBoundingClientRect()
      return {
        top :(msgRect.y + (msgRect.height/2) - (avatarRect.height/2)) + 'px',
        left: (msgRect.x - avatarRect.width + 6)+ 'px'
      }
    } else {
      return this.getCenteredAvatarPosition(avatarElm)
    }
  }

  getCenteredAvatarPosition(avatarElm: HTMLElement) {
    let avatarRect = avatarElm.getBoundingClientRect()
    return {
      top: 'calc( 50vh - ' + avatarRect.height/2 + 'px )', // spaced between vh and px and - are important
      left: 'calc( 50vw - ' + avatarRect.width/2 + 'px )'
    }
  }
}
