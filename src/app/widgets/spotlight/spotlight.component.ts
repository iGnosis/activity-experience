import { AfterViewInit, Component, OnInit } from '@angular/core';
import { EventsService } from 'src/app/services/events/events.service';
import { SpotlightActionShowMessageDTO, SpotlightActionShowMessagesDTO } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-spotlight',
  templateUrl: './spotlight.component.html',
  styleUrls: ['./spotlight.component.scss']
})
export class SpotlightComponent implements OnInit, AfterViewInit {

  message: string | undefined = '' 
  hidden = false
  messagesQueue: Array<SpotlightActionShowMessageDTO> = []

  constructor(private eventService: EventsService) { }
  
  ngAfterViewInit(): void {
    this.eventService.addContext('spotlight', this)
  }

  ngOnInit(): void {
  }
  

  action_showMessages(data: SpotlightActionShowMessagesDTO) {
    // Show messages at an interval and then throw the next event.
    this.messagesQueue = this.messagesQueue.concat(data.data.messages)
    this.processMessageQueue()
  }

  processMessageQueue() {
    if (Array.isArray(this.messagesQueue) && this.messagesQueue.length > 0) {
      const message = this.messagesQueue.shift()
      this.message = message?.text
      setTimeout(() => {
        this.processMessageQueue()
      }, message?.timeout);
    }
  }

  action_show(data: any) {
    this.hidden = false
  }

  action_hide(data: any) {
    this.hidden = true
  }
}
