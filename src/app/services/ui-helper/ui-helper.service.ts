import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiHelperService {
  private boundingBox: any;
  constructor() {}

  setBoundingBox(
    streamWidth: number,
    streamHeight: number,
    window: { innerHeight: number; innerWidth: number },
  ) {
    // AR = AspectRatio
    const videoAR = streamWidth / streamHeight;
    const screenAR = window.innerWidth / window.innerHeight;
    if (screenAR > videoAR) {
      // Screen is wider than the video
      // Video is centered horizontally and has height = window.innerHeight
      const scale = window.innerHeight / streamHeight;
      const newWidth = streamWidth * scale;
      const paddingLeft = Math.floor((window.innerWidth - newWidth) / 2);
      this.boundingBox = {
        topLeft: { x: paddingLeft, y: 0 },
        topRight: { x: window.innerWidth - paddingLeft, y: 0 },
        bottomLeft: { x: paddingLeft, y: window.innerHeight },
        bottomRight: {
          x: window.innerWidth - paddingLeft,
          y: window.innerHeight,
        },
      };
      return this.boundingBox;
    } else {
      // Screen is taller than the video
      // Video is centered vertically and has width = window.innerWidth
      const scale = window.innerWidth / streamWidth;
      const newHeight = streamHeight * scale;
      const paddingTop = Math.floor((window.innerHeight - newHeight) / 2);
      this.boundingBox = {
        topLeft: { x: 0, y: paddingTop },
        topRight: { x: window.innerWidth, y: paddingTop },
        bottomLeft: { x: 0, y: window.innerHeight - paddingTop },
        bottomRight: {
          x: window.innerWidth,
          y: window.innerHeight - paddingTop,
        },
      };
      return this.boundingBox;
    }
  }

  getBoundingBox() {
    return this.boundingBox;
  }

  // locatePoint(x: number, y: number) {

  // }
}
