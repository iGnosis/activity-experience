import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatestWith } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Activities, Activity, GameState, QaBody } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { ApiService } from '../checkin/api.service';
import { GameService } from '../game/game.service';

@Injectable({
  providedIn: 'root',
})
export class QaService {
  isQaAppReady = false;
  socket: Socket;

  constructor(
    private gameService: GameService,
    private store: Store<{ game: GameState }>,
    private apiService: ApiService,
  ) {
    this.socket = io(environment.websocketEndpoint, {
      query: {
        userId: localStorage.getItem('patient'),
        authToken: localStorage.getItem('token'),
      },
    });
    this.socket.on('connect', () => {
      this.sendGameChanges();
      this.socket.onAny((eventName, ...args) =>
        console.log('Event: ' + eventName, 'was fired with args: ', args),
      );
    });
  }

  sendGameChanges() {
    this.store
      .select((store) => store.game)
      .pipe(combineLatestWith(this.gameService.gameStageSubject))
      .subscribe(async ([_, gameStage]: any) => {
        let game;
        try {
          const gameObj = await this.apiService.getLastGameForQA();
          if (gameObj.length > 0) {
            game = gameObj[0];
          }
        } catch (err) {
          console.log(err);
        }

        if (game) {
          const gameInfo: Activity = {
            activity: game.game,
            stage: gameStage,
            config: {
              ...environment.settings[game.game as Activities],
              ...game.settings,
            },
          };
          this.socket.emit('qa', {
            event: 'send-game-info',
            payload: gameInfo,
          });
        }
      });
  }

  init(): void {
    this.socket.on('qa', (body: QaBody) => {
      if (body.event === 'request-game-info') {
        this.sendGameChanges();
      }

      if (body.event === 'edit-game') {
        // edit the current game
        if (body.payload.config) {
          this.gameService.setConfig(body.payload.config);
        }
        this.gameService.setStage(body.payload.stage);
        this.gameService.setGame(body.payload.activity);

        // fetch current game info
        const gameInfo = {
          activity: body.payload.game,
          level: body.payload.stage,
          config: {
            ...environment.settings[body.payload.game as Activities],
            ...body.payload.config,
          },
        };
        this.socket.emit('qa', {
          event: 'send-game-info',
          payload: gameInfo,
        });
      }

      if (body.event === 'change-music-preference') {
        // update music preference in database
        this.gameService.setGenre(body.payload.genre);
      }
    });
  }
}
