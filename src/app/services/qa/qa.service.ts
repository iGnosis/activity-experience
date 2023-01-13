import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Activities, QaBody } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { GameService } from '../game/game.service';

@Injectable({
  providedIn: 'root',
})
export class QaService {
  isQaAppReady = false;
  socket: Socket;

  constructor(private gameService: GameService) {
    this.socket = io(environment.websocketEndpoint, {
      query: {
        userId: localStorage.getItem('patient'),
        authToken: localStorage.getItem('token'),
      },
    });
  }

  init(): void {
    this.socket.on('qa', (body: QaBody) => {
      // this will be in QA App:
      // if (body.event === 'ready') {
      //  console.log('QA App can now start with requesting the current game rules.');
      // }

      if (body.event === 'request-game-info') {
        // fetch current game rules

        this.socket.emit('qa', {
          event: 'send-game-info',
          payload: {
            activity: 'activityName',
            level: 'currentLevel',
            speed: 'currentSpeed',
          },
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
