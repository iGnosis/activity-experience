import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Activities, Activity, QaBody } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { ApiService } from '../checkin/api.service';
import { GameService } from '../game/game.service';

@Injectable({
  providedIn: 'root',
})
export class QaService {
  isQaAppReady = false;
  socket: Socket;

  constructor(private gameService: GameService, private apiService: ApiService) {
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
    this.gameService.gameStatusSubject.subscribe(async (gameStatus) => {
      let settings;
      try {
        settings = await this.apiService.getGameSettings(gameStatus.game);
      } catch (err) {
        console.log(err);
      }

      const gameInfo: Activity = {
        activity: gameStatus.game,
        stage: gameStatus.stage,
        config: {
          ...environment.settings[gameStatus.game],
          ...(settings || {}),
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

      if (body.event === 'request-game-rules') {
        if (body.payload.game) {
          this.socket.emit('qa', {
            event: 'send-game-rules',
            payload: {
              rules:
                environment.settings[body.payload.game as Activities].levels[body.payload.level]
                  .rules,
            },
          });
        }
      }
    });
  }
}
