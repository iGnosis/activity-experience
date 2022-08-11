import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { ElementsService } from 'src/app/services/elements/elements.service';
import { GameStateService } from 'src/app/services/game-state/game-state.service';
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
  videoAvailable = false;
  browserSupported = false;
  cameraStatus?: 'success' | 'failure';

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private gameService: GameService,
    private userService: UserService,
    private route: ActivatedRoute,
    private store: Store,
    private gameStateService: GameStateService,
  ) {
    if (
      navigator.userAgent.indexOf('Chrome') != -1 ||
      navigator.userAgent.indexOf('Firefox') != -1
    ) {
      this.browserSupported = true;
    }
  }
  async ngOnInit(): Promise<void> {
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
      async (data) => {
        const tokenHandled = this.userService.handleToken(data);
        if (tokenHandled) {
          this.cameraStatus = await this.gameService.bootstrap(
            this.video.nativeElement,
            this.canvas.nativeElement,
          );
          this.videoAvailable = true;
        }
      },
      false,
    );

    if (this.route.snapshot.queryParamMap.get('debug')) {
      this.cameraStatus = await this.gameService.bootstrap(
        this.video.nativeElement,
        this.canvas.nativeElement,
      );
    }
  }

  @HostListener('window:unload', ['$event'])
  doBeforeUnload() {
    this.store
      .select((state: any) => state.game)
      .pipe(take(1))
      .subscribe((game) => {
        if (game.id) {
          const { id, ...gameState } = game;
          this.gameStateService.updateGame(id, gameState);
        }
      });
    return false;
  }

  refreshTab() {
    window.location.reload();
  }
}
