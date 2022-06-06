import { Injectable } from '@angular/core';
import { DebugStackItem } from 'src/app/types/pointmotion';
@Injectable({
  providedIn: 'root',
})
export class DebugService {
  constructor() {}

  items: Array<DebugStackItem> = [];
  events = {
    taskEnded: 'taskStarted',
    sessionEnded: 'sessionStarted',
    activityEnded: 'activityStarted',
  };

  pushItem(item: DebugStackItem) {
    this.items.push(item);

    // only runs on 'ended' events.
    if (item.eventType in this.events) {
      let counter = 0;
      for (let i = this.items.length - 1; i >= 0; i--) {
        counter++;
        if (this.items[i].eventType === (this.events as any)[item.eventType]) {
          this.items.splice(this.items.length - 1, counter);
        }
      }
    }
  }

  checkIfStackEmpty() {
    if (this.items.length === 0) {
      return true;
    }
    return false;
  }

  inspectStack() {
    if (!this.checkIfStackEmpty()) {
      console.warn('Stack is not empty!');
      console.warn(this.items);
    } else {
      console.log('stack items:');
      console.log(this.items);
    }
  }
}
