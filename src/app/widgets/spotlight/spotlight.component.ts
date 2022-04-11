import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SoundsService } from 'src/app/services/sounds/sounds.service';
import {
  SpotlightActionShowMessageDTO,
  SpotlightActionShowMessagesDTO,
} from 'src/app/types/pointmotion';

@Component({
  selector: 'app-spotlight',
  templateUrl: './spotlight.component.html',
  styleUrls: ['./spotlight.component.scss'],
})
export class SpotlightComponent implements OnInit, AfterViewInit {
  message: string | undefined = '';
  hidden = false;
  messagesQueue: Array<SpotlightActionShowMessageDTO> = [];

  constructor() {}

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {}

  async action_showMessages(data: SpotlightActionShowMessagesDTO) {
    // Show messages at an interval and then throw the next event.
    this.messagesQueue = this.messagesQueue.concat(data.data.messages);
    console.log('start action_showMessages');
    await this.processMessageQueue();
    console.log('end action_showMessages');
  }

  async processMessageQueue() {
    return new Promise(async (resolve, reject) => {
      if (Array.isArray(this.messagesQueue) && this.messagesQueue.length > 0) {
        // TODO: Handle the producer consumer problem
        for (let message of this.messagesQueue) {
          console.log('spotlight: updating message', message.text);

          this.message = message.text;
        //   await this.sleep(message.timeout);
        }
        this.messagesQueue = [];
        resolve({});
      }
    });
  }

  async sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({});
      }, timeout);
    });
  }

  async action_show(data: any) {
    this.hidden = false;
  }

  async action_hide(data: any) {
    this.hidden = true;
  }
}
