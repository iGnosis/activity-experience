import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'element-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss'],
})
export class PromptComponent implements OnInit {
  @Input() value: string | undefined;

  constructor() {}

  ngOnInit(): void {}
}
