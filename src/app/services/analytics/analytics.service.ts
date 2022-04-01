import { Injectable } from '@angular/core';
import { AnalyticsEvent, AnalyticsRow } from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { GqlClientService } from '../gql-client/gql-client.service';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private gql: GqlClientService) {}

  // TODO: batch events, save them in localStorage and let a webworker process the queue
  async sendEvent(event: AnalyticsEvent) {
    const analyticsRow: AnalyticsRow = {
      patient: environment.patient, // TODO remove hardcoded
      session: '0c517e70-a061-4db2-88ee-9bb1b1f7a9a0', // TODO remove hardcoded
      activity: event.activity,
      task_id: event.task_id,
      task_name: event.task_name,
      attempt_id: event.attempt_id,
      event_type: event.event_type,
      created_at: new Date().getTime(),
      score: event.score
    }

    return this.gql.req(`mutation InsertEvent($patient: uuid, $session: uuid, $activity: uuid, $task_id: uuid, $attempt_id: uuid, $task_name: String, $event_type: String, $created_at: bigint!, $score: float8) {
      insert_events_one(object:
        {
          patient: $patient,
          session: $session,
          activity: $activity,
          task_id: $task_id,
          attempt_id: $attempt_id,
          task_name: $task_name,
          event_type: $event_type,
          created_at: $created_at,
          score: $score
        }) {
          id
      }
    }`, analyticsRow)
  }

  getActivityId(name: string) {
    switch(name) {
      case 'Calibration':
        return 'd97e90d4-6c7f-4013-94f7-ba61fd52acdc'
      case 'Sit to Stand':
        return '0fa7d873-fd22-4784-8095-780028ceb08e'
      default:
        console.error(name)
        throw new Error('Activity not found ')
    }
  }

}
