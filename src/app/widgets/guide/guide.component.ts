import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  GuideAvatarDTO,
  GuideMessageDTO,
  GuidePromptDTO,
  GuideSpotlightDTO,
  GuideState,
} from 'src/app/types/pointmotion';
import { faCoffee } from '@fortawesome/free-solid-svg-icons';
import { GuideService } from 'src/app/services/guide/guide.service';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss'],
})
export class GuideComponent implements AfterViewInit {
  icon = faCoffee;
  state: GuideState = {};
  @ViewChild('avatar') avatar!: ElementRef;
  @ViewChild('messageCenter') messageCenter!: ElementRef;
  @ViewChild('messageBottom') messageBottom!: ElementRef;
  avatarPosition = '';

  constructor(
    private store: Store<{ guide: GuideState }>,
    private guideService: GuideService,
  ) {}

  ngAfterViewInit(): void {
    this.store
      .select((state) => state.guide.avatar)
      .subscribe((avatar: GuideAvatarDTO | undefined) => {
        if (avatar) {
          this.handleAvatarUpdate(avatar);
        } else {
          this.handleHideAvatar();
        }
      });

    this.store
      .select((state) => state.guide.message)
      .subscribe((message: GuideMessageDTO | undefined) => {
        if (message) {
          this.handleSendMessage(message);
        } else {
          this.handleHideMessage();
        }
      });

    this.store
      .select((state) => state.guide.spotlight)
      .subscribe((spotlight: GuideSpotlightDTO | undefined) => {
        if (spotlight) {
          this.handleSpotlight(spotlight);
        } else {
          this.handleHideSpotlight();
        }
      });

    this.store
      .select((state) => state.guide.prompt)
      .subscribe((prompt: GuidePromptDTO | undefined) => {
        if (prompt) {
          this.handlePrompt(prompt);
        } else {
          this.handleHidePrompt();
        }
      });

    this.store
      .select((state) => state.guide.video)
      .subscribe((video) => {
        console.log('video', video);

        if (video) {
          this.state.video = video;
        } else {
          this.state.video = undefined;
        }
      });
  }

  handleSendMessage(newMessage: GuideMessageDTO | undefined) {
    this.state.message = newMessage;
    console.log(newMessage);
    if (this.state.message) {
      this.state.message = Object.assign({}, this.state.message);
      // Handle change
      if (this.state.message.position != newMessage?.position) {
        // do some animation thingy
      }

      if (this.state.message.text !== newMessage?.text) {
        this.state.message.text = newMessage?.text;
      }
    } else {
      this.state.message = newMessage;
    }

    setTimeout(() => {
      // once the new message box is in position
      this.handleAvatarImagePosition();
    });
  }

  // avatar image, expression or location can change
  handleAvatarUpdate(newAvatar: GuideAvatarDTO | undefined) {
    this.state.avatar = Object.assign({}, newAvatar);
    this.handleAvatarImagePosition();
  }

  handleAvatarImagePosition() {
    if (!this.avatar || !this.avatar.nativeElement) return;

    const result = this.guideService.getAvatarPosition(
      this.state.avatar,
      this.avatar?.nativeElement,
      this.messageCenter?.nativeElement,
      this.messageBottom?.nativeElement,
    );
    setTimeout(() => {
      this.avatar.nativeElement.style.top = result.top;
      this.avatar.nativeElement.style.left = result.left;
    });
  }

  handleSpotlight(spotlight: GuideSpotlightDTO) {
    this.state.spotlight = Object.assign({}, spotlight);
  }

  handlePrompt(prompt: GuidePromptDTO) {
    this.state.prompt = Object.assign({}, prompt);
    this.state.prompt.className +=
      ' ' + this.guideService.getPromptClassNames(this.state.prompt.position);
  }

  handleHideAvatar() {
    console.log('hide avatar');
    this.state.avatar = undefined;
  }

  handleHideMessage() {
    this.state.message = undefined;
  }

  handleHideSpotlight() {
    this.state.spotlight = undefined;
  }

  handleHidePrompt() {
    console.log(this.state);

    this.state.prompt = undefined;
    console.log(this.state);
  }
}
