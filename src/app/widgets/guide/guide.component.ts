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

  messageTitle: string | undefined = '' 
  messageBody: string | undefined = ''
  hidden = false
  messagesQueue: Array<GuideActionShowMessageDTO> = []
  messages$?: Observable<string | undefined>
  handlingQueue = false
  requestQueue: Array<GuideActionShowMessagesDTO> = [] // Queue the incoming requests as well...

  constructor(private eventService: EventsService, private store: Store<{guide: GuideActionShowMessageDTO}>) { 
    
  }

  ngAfterViewInit(): void {
    this.eventService.addContext('guide', this)

    // this.messages$ = this.store.select('guide')
    this.messages$ = this.store.select(state => state.guide.id)

    // hacky way of getting only one value without long running subscription...
    this.messages$.subscribe((message: string | undefined) => {
      const guideMessageSubscription = this.store.select('guide').subscribe(data => {
        this.messageTitle = data.title
        this.messageBody = data.text
        setTimeout(() => {
          guideMessageSubscription.unsubscribe()
        })
      })
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
          
          this.messageBody = message.text
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
