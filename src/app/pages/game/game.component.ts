import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ElementsService } from 'src/app/services/elements/elements.service';
import { GameService } from 'src/app/services/game/game.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit {
  @ViewChild('videoElm') video!: ElementRef;
  @ViewChild('canvasElm') canvas!: ElementRef;
  @ViewChild('gameElm') gameElm!: ElementRef;

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private gameService: GameService,
  ) {}

  async ngAfterViewInit() {
    this.gameService.start(this.video.nativeElement, this.canvas.nativeElement);
  }
}
