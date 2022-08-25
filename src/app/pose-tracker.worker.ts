// const socket = new WebSocket(environment.apiEndpoint.replace('https://', 'wss://'));
const poseTrackerFn = () => {
  let endpoint = '';
  let socket: WebSocket;
  return ({ data }: any) => {
    if (typeof data === 'string') {
      endpoint = data;
      socket = new WebSocket(endpoint);
      return;
    }

    const { poseLandmarks: p, timestamp: t, gameId: g, userId: u } = data;
    if (p && p.filter((landmark: any) => landmark.visibility < 0.7).length > 0) return;
    if (socket) socket.send(JSON.stringify({ t, g, u, p }));
  };
};
addEventListener('message', poseTrackerFn());
