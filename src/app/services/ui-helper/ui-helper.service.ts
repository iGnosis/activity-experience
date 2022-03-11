import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiHelperService {

  boundingBox: any
  constructor() { }

  setBoundingBox(stream: MediaStream) {
    const tracks = stream.getTracks()
    if(Array.isArray(tracks) && tracks.length > 0) {
      const track = tracks[0]
      const width = track.getSettings().width || 0
      const height = track.getSettings().height || 0 

      if (!width || !height) {
        throw Error('could not calculate the width and height of the video')
      } else {
        // AR = AspectRatio
        const videoAR = width/height 
        const screenAR = window.innerWidth/window.innerHeight
        if(screenAR > videoAR) {
          // Screen is wider than the video
          // Video is centered horizontally and has height = window.innerHeight
          const scale = window.innerHeight / height
          const newWidth = width * scale
          const paddingLeft = Math.floor((window.innerWidth - newWidth)/2)
          this.boundingBox = {
            topLeft: {x: paddingLeft, y: 0},
            topRight: {x: window.innerWidth - paddingLeft, y: 0},
            bottomLeft: {x: paddingLeft, y: window.innerHeight},
            bottomRight: {x: window.innerWidth - paddingLeft, y: window.innerHeight}
          }
          return this.boundingBox
        } else {
          // Screen is taller than the video
          // Video is centered vertically and has width = window.innerWidth
          const scale = window.innerWidth / width
          const newHeight = height * scale 
          const paddingTop = Math.floor((window.innerHeight - newHeight)/2)
          this.boundingBox = {
            topLeft: {x: 0, y: paddingTop},
            topRight: {x: window.innerWidth, y: paddingTop},
            bottomLeft: {x: 0, y:  window.innerHeight - paddingTop},
            bottomRight: {x: window.innerWidth, y:  window.innerHeight - paddingTop}
          }
          return this.boundingBox
        }
      }
    } else {
      throw Error('No video track found in the stream')
    }
  }

  getBoundingBox() {
    return this.boundingBox
  }
}
