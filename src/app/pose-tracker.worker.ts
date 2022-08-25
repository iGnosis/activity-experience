/// <reference lib="webworker" />

interface PoseTracker {
  t: number;
  g: string;
  u: string;
  p: any[];
}

addEventListener('message', ({ data }: any) => {
  const { poseLandmarks: p, timestamp: t, gameId: g, userId: u } = data;
  if (p && p.filter((landmark: any) => landmark.visibility < 0.7).length > 0) return;
  postMessage({ t, g, u, p });
});
