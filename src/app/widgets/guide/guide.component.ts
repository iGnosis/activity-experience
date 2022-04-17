import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { GuideActionShowMessageDTO, GuideActionShowMessagesDTO, GuideAvatarDTO, GuideMessageDTO, GuideState } from 'src/app/types/pointmotion';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { GuideService } from 'src/app/services/guide/guide.service';

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

  constructor(
    private store: Store<{guide: GuideState}>,
    private guideService: GuideService) { 
    
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

    setTimeout(() => {
      // once the new message box is in position
      this.handleAvatarImagePosition()
    })
    
  }

  // avatar image, expression or location can change
  handleAvatarUpdate(newAvatar: GuideAvatarDTO | undefined) {
    this.state.avatar = Object.assign({}, newAvatar)
    this.handleAvatarImagePosition()
  }

  handleAvatarImagePosition() {
    let result = this.guideService.getAvatarPosition(this.state.avatar, this.avatar?.nativeElement, 
                              this.messageCenter?.nativeElement, this.messageBottom?.nativeElement)
    setTimeout(() => {
      this.avatar.nativeElement.style.top = result.top
      this.avatar.nativeElement.style.left = result.left
    })
  }

  handleHideAvatar() {
    console.log('hide avatar');
    
    this.state.avatar = undefined
  }

  handleHideMessage() {
    this.state.message = undefined
  }

}
