import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { GameLifeCycleStages } from 'src/app/types/enum';

@Injectable({
  providedIn: 'root',
})
export class GameLifecycleService {
  stage: GameLifeCycleStages;
  constructor() {}

  private stageSubject = new Subject<GameLifeCycleStages>();
  public stage$: Observable<GameLifeCycleStages> = this.stageSubject.asObservable();

  public enterStage(stage: GameLifeCycleStages) {
    this.stage = stage;
    this.stageSubject.next(this.stage);
    console.log('enterStage: ', this.stage);
  }

  public resetStage(stage: GameLifeCycleStages) {
    if (this.stage === stage) {
      this.stage = GameLifeCycleStages.RESET;
      this.stageSubject.next(this.stage);
    }
  }
}
