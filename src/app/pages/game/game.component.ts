import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ElementsService } from 'src/app/services/elements/elements.service';
import { GameService } from 'src/app/services/game/game.service';
import { UiHelperService } from 'src/app/services/ui-helper/ui-helper.service';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  @ViewChild('videoElm') video!: ElementRef;
  @ViewChild('canvasElm') canvas!: ElementRef;
  @ViewChild('gameElm') gameElm!: ElementRef;

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private gameService: GameService,
    private userService: UserService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit(): void {
    // Ask the parent window to send a token... we're ready, well almost.
    window.parent.postMessage(
      {
        type: 'activity-experience-ready',
        data: {
          status: 'ready',
        },
      },
      '*',
    );

    // Handle the incoming token
    window.addEventListener(
      'message',
      (data) => {
        const tokenHandled = this.userService.handleToken(data);
        if (tokenHandled) {
          this.gameService.bootstrap(this.video.nativeElement, this.canvas.nativeElement);
        }
      },
      false,
    );

    if (this.route.snapshot.queryParamMap.get('debug')) {
      this.gameService.bootstrap(this.video.nativeElement, this.canvas.nativeElement);
    }
  }
}
