/// <reference lib="webworker" />

import { environment } from 'src/environments/environment';

interface PoseTracker {
  t: number;
  g: string;
  u: string;
  p: any[];
}
// const socket = new WebSocket(environment.apiEndpoint.replace('https://', 'wss://'));
const socket = new WebSocket(environment.apiEndpoint);
addEventListener('message', ({ data }: any) => {
  const { poseLandmarks: p, timestamp: t, gameId: g, userId: u } = data;
  if (p && p.filter((landmark: any) => landmark.visibility < 0.7).length > 0) return;
  socket.send(JSON.stringify({ t, g, u, p }));
});
