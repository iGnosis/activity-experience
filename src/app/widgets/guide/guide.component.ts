import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { EventsService } from 'src/app/services/events/events.service';
import { GuideActionShowMessageDTO, GuideActionShowMessagesDTO } from 'src/app/types/pointmotion';

@Component({
  selector: 'app-guide',
  templateUrl: './guide.component.html',
  styleUrls: ['./guide.component.scss']
})
export class GuideComponent implements AfterViewInit {

  message: string | undefined = '' 
  hidden = false
  messagesQueue: Array<GuideActionShowMessageDTO> = []
  messages$?: Observable<GuideActionShowMessagesDTO>
  handlingQueue = false
  requestQueue: Array<GuideActionShowMessagesDTO> = [] // Queue the incoming requests as well...

  constructor(private eventService: EventsService, private store: Store<{guide: GuideActionShowMessagesDTO}>) { 
    
  }

  ngAfterViewInit(): void {
    this.eventService.addContext('guide', this)

    this.messages$ = this.store.select(state => state.guide)

    this.messages$.subscribe(data => {
      if(this.requestQueue.length == 0) {
        this.action_showMessages(data)
      } else {
        this.requestQueue.push(data)
      }
      
    })

  }


  async action_showMessages(data: GuideActionShowMessagesDTO | undefined) {
    if (!data || !data.data) return

    // Show messages at an interval and then throw the next event.
    this.messagesQueue = data.data.messages
    console.log('start action_showMessages');
    await this.processMessageQueue()
    console.log('end action_showMessages');

    if(this.requestQueue.length) {
      this.action_showMessages(this.requestQueue.shift())
    }
  }

  async processMessageQueue() {
    return new Promise(async (resolve, reject) => {
      if (Array.isArray(this.messagesQueue) && this.messagesQueue.length > 0) {
        // TODO: Handle the producer consumer problem
        for(let message of this.messagesQueue) {
          console.log('spotlight: updating message', message.text);
          
          this.message = message.text
          await this.sleep(message.timeout)
        }
        this.messagesQueue = []
        resolve({})
      }
    })
    
  }

  async sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({})
      }, timeout)
    })
  }

  async action_show(data: any) {
    this.hidden = false
  }

  async action_hide(data: any) {
    this.hidden = true
  }

}
