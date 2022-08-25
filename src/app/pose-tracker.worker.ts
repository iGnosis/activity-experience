// const socket = new WebSocket(environment.apiEndpoint.replace('https://', 'wss://'));

import { io, Socket } from 'socket.io-client';

const poseTrackerFn = () => {
  let endpoint = '';
  let socket: Socket;

  return ({ data }: any) => {
    switch (data.type) {
      case 'connect':
        endpoint = data;
        socket = io(endpoint);
        break;
      case 'update-pose':
        const { poseLandmarks: p, timestamp: t, gameId: g, userId: u } = data;
        if (p && p.filter((landmark: any) => landmark.visibility < 0.7).length > 0) return;
        if (socket) socket.send({ t, g, u, p });
        break;
      case 'game-end':
        const { gameId, userId } = data;
        if (socket) socket.emit('game-end', { userId, gameId });
        break;
    }
  };
};
addEventListener('message', poseTrackerFn());
