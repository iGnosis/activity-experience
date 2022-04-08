import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-announcement',
  templateUrl: './announcement.component.html',
  styleUrls: ['./announcement.component.scss']
})
export class AnnouncementComponent implements OnInit {

  @Input() text: string | undefined = `Let's Go`
  
  constructor() { }

  background = '#88EBA9'

  ngOnInit(): void {
  }

}
