import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { io, Socket } from 'socket.io-client';
import { JwtService } from '../jwt/jwt.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket?: Socket;

  constructor(private jwtService: JwtService) {
    this.connect();
  }

  connect() {
    this.socket = io(environment.websocketEndpoint, {
      query: {
        userId: localStorage.getItem('patient'),
        authToken: this.jwtService.getToken(),
      },
    });
  }

  sendLogsToServer(logs: string) {
    this.socket?.emit('cloudwatch-log', { logs, portal: 'activity-experience' });
  }
}
