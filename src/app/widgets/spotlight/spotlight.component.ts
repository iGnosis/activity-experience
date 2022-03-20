import { AfterViewInit, Component, OnInit } from '@angular/core';
import { EventsService } from 'src/app/services/events/events.service';

@Component({
  selector: 'app-spotlight',
  templateUrl: './spotlight.component.html',
  styleUrls: ['./spotlight.component.scss']
})
export class SpotlightComponent implements OnInit, AfterViewInit {

  message: string = ''

  constructor(private eventService: EventsService) { }
  
  ngAfterViewInit(): void {
    this.eventService.addContext('spotlight', this)
  }

  ngOnInit(): void {
  }

  

  event_welcome(data: any) {
    console.log(data)
    this.message = data.id
  }
}
