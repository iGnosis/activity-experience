// const socket = new WebSocket(environment.apiEndpoint.replace('https://', 'wss://'));

import { io, Socket } from 'socket.io-client';

const poseTrackerFn = () => {
  let endpoint = '';
  let socket: Socket;

  return ({ data }: any) => {
    if (typeof data === 'string') {
      endpoint = data;
      socket = io(endpoint);
      return;
    }

    const { poseLandmarks: p, timestamp: t, gameId: g, userId: u } = data;
    if (p && p.filter((landmark: any) => landmark.visibility < 0.7).length > 0) return;
    if (socket) socket.send({ t, g, u, p });
  };
};
addEventListener('message', poseTrackerFn());
