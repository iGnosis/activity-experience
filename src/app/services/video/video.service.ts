import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store'
import { frame } from 'src/app/store/actions/frame.actions';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  videoElement?: HTMLVideoElement
  canvas?: HTMLCanvasElement
  width = 0
  height = 0
  constructor(private store: Store<{frame: Uint8ClampedArray}>) { }

  getVideoElement(): HTMLVideoElement | undefined {
    return this.videoElement
  }

  setVideoElement(elm: HTMLVideoElement) {
    this.videoElement = elm
  }

  /**
   * Extracts frames from the video element and sends them to the store
   * 
   */
  startExtractingFramesFromStream(stream: MediaStream, video: HTMLVideoElement, fps: number) {
    const tracks = stream.getVideoTracks()
    if(Array.isArray(tracks) && tracks.length > 0) {
      const video = tracks[0]
      this.height = video.getSettings().height || 0
      this.width = video.getSettings().width || 0

      if (!this.width || !this.height) {
        throw new Error('could not get dimensions of the video')
      }

    } else {
      console.error(tracks)
      throw new Error('Invalid video track')
    }
    this.canvas = this.canvas || document.createElement('canvas')
    this.canvas.width = this.width
    this.canvas.height = this.height
    
    // Let a different function handle extraction of frames at fps
    const repeat = setInterval(() => {
      if(this.canvas) {
        this._extractFrame(stream, video, this.canvas)
      } else {
        clearInterval(repeat)
      }
    }, 1000)
  }

  _extractFrame(stream: MediaStream, video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')
    context?.drawImage(video, 0, 0, this.width, this.height)
    // const data = context?.getImageData(0, 0, this.width, this.height).data
    const data = canvas.toDataURL('jpeg')
    if(data) {
      const update = {frame: data}
      this.store.dispatch(frame.send(update))
    }
  }

}
