import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GuideActionShowMessageDTO, GuideActionShowMessagesDTO, GuideAvatarDTO, GuideMessageDTO, GuideState } from 'src/app/types/pointmotion';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss']
})
export class GuideComponent implements AfterViewInit {

  icon = faCoffee
  state: GuideState = {}
  @ViewChild('avatar') avatar!: ElementRef;
  @ViewChild('messageCenter') messageCenter!: ElementRef;
  @ViewChild('messageBottom') messageBottom!: ElementRef;
  avatarPosition = ''

  constructor(private store: Store<{guide: GuideState}>) { 
    
  }

  ngAfterViewInit(): void {

    this.store.select(state => state.guide.avatar).subscribe((avatar: GuideAvatarDTO | undefined) => {
      if (avatar) {
        this.handleAvatarUpdate(avatar)
      } else {
        this.handleHideAvatar()
      }
    })

    this.store.select(state => state.guide.message).subscribe((message: GuideMessageDTO | undefined) => {
      if (message) {
        this.handleSendMessage(message)
      } else {
        this.handleHideMessage()
      }
    })

    // handle spotlight
    // handle prompt
  }

  handleSendMessage(newMessage: GuideMessageDTO | undefined) {
    this.state.message = newMessage
    console.log(newMessage);
    if (this.state.message) {
      this.state.message = Object.assign({}, this.state.message)
      // Handle change
      if (this.state.message.position != newMessage?.position) {
        // do some animation thingy
      } 

      if (this.state.message.text !== newMessage?.text) {
        this.state.message.text = newMessage?.text
      }
    } else {
      this.state.message = newMessage
    }
  }

  // avatar image, expression or location can change
  handleAvatarUpdate(newAvatar: GuideAvatarDTO | undefined) {
    console.log(newAvatar)
    this.avatarPosition = ''
    // It's a change event...
    if(this.state.avatar && newAvatar) {
      // Detect the change which happened
      if ( this.state.avatar.name != newAvatar.name ) {
        // just change the image
        this.state.avatar = Object.assign({}, this.state.avatar)
        this.state.avatar.name = newAvatar.name
      } 
      
      if ( this.state.avatar.position != newAvatar.position ) {
        if (this.state.message?.text && this.state.message.position) {
          // position the avatar according to the message box
          let msgRect
          let avatarRect = this.avatar.nativeElement.getBoundingClientRect()
          // debugger
          switch(this.state.message.position) {

            case 'bottom':
              msgRect = this.messageBottom.nativeElement.getBoundingClientRect()
              console.log(msgRect);
              
              // the vertical centers of both the message box and avatar should be same
              // this.avatar.nativeElement.style.top = 
              const top = (msgRect.y + (msgRect.height/2) - (avatarRect.height/2)) + 'px'
              console.log(top);
              
              this.avatar.nativeElement.style.top = top
              this.avatar.nativeElement.style.left = 0
              
              break;
            case 'center':
            default:
              // console.log(this.messageCenter.nativeElement.offsetTop);
              // console.log(this.messageCenter.nativeElement.offsetLeft);
              msgRect = this.messageCenter.nativeElement.getBoundingClientRect()
              console.log(msgRect);
              this.avatar.nativeElement.style.top = (msgRect.y + (msgRect.height/2) - (avatarRect.height/2)) + 'px'
              this.avatar.nativeElement.style.left = (msgRect.x - avatarRect.width + 6)+ 'px'
              break
          }
        } else {

        }
      }
      if (!this.state.message?.text && this.state.avatar.position) {
        // just let the position class do it's thing
        this.avatarPosition = this.state.avatar.position
      }
      // remove the old avatar
    } else if (newAvatar){ // It's the avatar getting updated for the first time
      this.state.avatar = newAvatar
    } 
  }

  handleHideAvatar() {
    console.log('hide avatar');
    
    this.state.avatar = undefined
  }

  handleHideMessage() {
    this.state.message = undefined
  }

}
