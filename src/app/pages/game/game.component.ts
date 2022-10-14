import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { ApiService } from 'src/app/services/checkin/api.service';
import { ElementsService } from 'src/app/services/elements/elements.service';
import { GameService } from 'src/app/services/game/game.service';
import { GoogleAnalyticsService } from 'src/app/services/google-analytics/google-analytics.service';
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
  cameraStatus?: 'success' | 'failure';

  constructor(
    private elements: ElementsService,
    private uiHelperService: UiHelperService,
    private gameService: GameService,
    private userService: UserService,
    private route: ActivatedRoute,
    private store: Store,
    private apiService: ApiService,
    private googleAnalyticsService: GoogleAnalyticsService,
  ) {}
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
            data.data.benchmarkId,
          );
          this.videoAvailable = true;
          if (this.cameraStatus === 'failure') {
            this.googleAnalyticsService.sendEvent('camera_not_found');
          }
        }
      },
      false,
    );

    if (this.route.snapshot.queryParamMap.get('debug')) {
      this.cameraStatus = await this.gameService.bootstrap(
        this.video.nativeElement,
        this.canvas.nativeElement,
      );
      if (this.cameraStatus === 'failure') {
        this.googleAnalyticsService.sendEvent('camera_not_found');
      }
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
          this.apiService.updateGame(id, gameState);
        }
      });
    return false;
  }

  refreshTab() {
    window.location.reload();
  }
}
