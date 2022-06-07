import { Injectable } from '@angular/core';
import { DebugTaskEvent, DebugStackEvents, TaskName, ActivityEvent } from 'src/app/types/pointmotion';
@Injectable({
  providedIn: 'root',
})

export class DebugService {
  constructor() {}

  // stack: SessionEvent | ActivityEvent | TaskEvent

  counter = 0;
  previousTask: TaskName = 'unknown';
  items: Array<DebugStackEvents> = [];

  endedEvents = {
    taskEnded: 'taskStarted',
    sessionEnded: 'sessionStarted',
    activityEnded: 'activityStarted',
  };

  _isTaskEvent(val: any): val is DebugTaskEvent {
    return val.hasOwnProperty('task_id');
  }

  _isActivityEvent(val: any): val is ActivityEvent {
    return val.hasOwnProperty('activity');
  }

  pushEvent(eventToInsert: DebugStackEvents) {
    // only runs on 'ended' events.
    if (eventToInsert.event_type in this.endedEvents) {
      let peekItem = this._peekStack();

      // should have at least two events.
      if (peekItem === undefined) {
        console.warn('event to insert:', eventToInsert);
        console.warn('cannot peek item - stack is empty:', this.items);
        return
      }

      // should have 'start' and 'end' events.
      if (peekItem.event_type !== (this.endedEvents as any)[eventToInsert.event_type]) {
        console.warn('event to insert:', eventToInsert);
        console.warn('start and end events mismatch:', this.items);
        return
      }

      // runs on 'taskEnded'
      if (this._isTaskEvent(eventToInsert)) {

        // event type should match.
        if (!this._isTaskEvent(peekItem)) {
          console.warn('event to insert:', eventToInsert);
          console.warn('stack data inconsistent:', this.items);
          return
        }

        // task_id should match.
        if (peekItem.task_id !== eventToInsert.task_id) {
          console.warn('event to insert:', eventToInsert);
          console.warn('task_id mismatch:', this.items);
          return
        }

        // reaction time should be present if previous task was different.
        if (this.counter == 1 && (peekItem.task_name !== this.previousTask && !peekItem.reacted)) {
          console.warn('event to insert:', eventToInsert);
          console.warn('reaction time event not sent:', this.items);

          // so that stack isn't corrupted.
          this._popItem();
          return
        }

        // ... or this.previousTask = eventToInsert.task_name;
        this.previousTask = peekItem.task_name;
        this.counter = 1;
      }

      // runs on 'activityEnded'
      else if (this._isActivityEvent(eventToInsert)) {

        // event type should match.
        if (!this._isActivityEvent(peekItem)) {
          console.warn('event to insert:', eventToInsert);
          console.warn('stack data inconsistent:', this.items);
          return
        }

        // activity name should match
        if (eventToInsert.activity !== peekItem.activity) {
          console.warn('event to insert:', eventToInsert);
          console.warn('activity name mismatch:', this.items);
          return
        }
      }

      // runs on 'sessionEnded'
      else {
        // event type should match.
        if (peekItem.event_type !== 'sessionStarted') {
          console.warn('event to insert:', eventToInsert);
          console.warn('stack data inconsistent:', this.items);
          return
        }
      }

      this._popItem();
    }

    else if (eventToInsert.event_type === 'taskReacted') {
      let peekItem = this._peekStack();

      // should have at least two events.
      if (peekItem === undefined) {
        console.warn('event to insert:', eventToInsert);
        console.warn('cannot peek item - stack is empty:', this.items);
        return
      }

      // event type should match.
      if (!this._isTaskEvent(peekItem) || peekItem.event_type !== 'taskStarted' || peekItem.reacted === true) {
        console.warn('event to insert:', eventToInsert);
        console.warn('stack data inconsistent:', this.items);
        return
      }

      peekItem.reacted = true;
    }

    else {
      this.items.push(eventToInsert);
    }
  }

  _peekStack() {
    return this.items[this.items.length - 1]
  }

  _popItem() {
    return this.items.pop();
  }

  _checkIfStackEmpty() {
    if (this.items.length === 0) {
      return true;
    }
    return false;
  }

  inspectStack() {
    if (!this._checkIfStackEmpty()) {
      console.warn('Stack is not empty!');
      console.warn(this.items);
    } else {
      console.log('stack items:');
      console.log(this.items);
    }
  }
}
