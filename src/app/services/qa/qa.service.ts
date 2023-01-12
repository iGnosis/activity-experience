import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { QaBody } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QaService {
  isQaAppReady = false;
  socket: Socket;

  constructor() {
    this.socket = io(environment.websocketEndpoint, {
      query: {
        userId: localStorage.getItem('patient'),
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

        // fetch current game info
        this.socket.emit('qa', {
          event: 'send-game-info',
          payload: {
            activity: 'activityName',
            level: 'currentLevel',
            speed: 'currentSpeed',
          },
        });
      }
    });
  }
}
