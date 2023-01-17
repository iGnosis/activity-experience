import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilKeyChanged, take } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Activities, GameState, QaBody } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { GameService } from '../game/game.service';

@Injectable({
  providedIn: 'root',
})
export class QaService {
  isQaAppReady = false;
  socket: Socket;

  constructor(private gameService: GameService, private store: Store<{ game: GameState }>) {
    this.socket = io(environment.websocketEndpoint, {
      query: {
        userId: localStorage.getItem('patient'),
        authToken: localStorage.getItem('token'),
      },
    });
    this.socket.on('connect', () => {
      this.init();
      this.sendGameChanges();
      this.socket.onAny((eventName, ...args) =>
        console.log('Event: ' + eventName, 'was fired with args: ', args),
      );
    });
  }

  sendGameChanges() {
    this.store
      .select((store) => store.game)
      .pipe(distinctUntilKeyChanged('game'))
      .subscribe((game) => {
        const gameInfo = {
          game: game.game,
          stage: this.gameService.gameStatus.stage,
          config: {
            ...environment.settings[game.game as Activities],
          },
        };
        this.socket.emit('qa', {
          event: 'send-game-info',
          payload: gameInfo,
        });
      });
  }

  init(): void {
    this.socket.on('qa', (body: QaBody) => {
      if (body.event === 'request-game-info') {
        // fetch current game rules
        let gameObj: GameState = {};
        this.store
          .select((store) => store.game)
          .pipe(take(1))
          .subscribe((game) => (gameObj = game));

        const gameInfo = {
          game: gameObj.game,
          stage: this.gameService.gameStatus.stage,
          config: {
            ...environment.settings[gameObj.game as Activities],
          },
        };

        this.socket.emit('qa', {
          event: 'send-game-info',
          payload: gameInfo,
        });
      }

      if (body.event === 'edit-game') {
        // edit the current game
        if (body.payload.config) {
          this.gameService.setConfig(body.payload.config);
        }
        this.gameService.setStage(body.payload.stage);
        this.gameService.setGame(body.payload.game);

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
