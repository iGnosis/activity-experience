import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ActivityEvent,
  ActivityEventRow,
  ActivityStage,
  ActivityState,
  AnalyticsEvent,
  AnalyticsRow,
  AnalyticsSessionEvent,
  AnalyticsSessionEventRow,
  CarePlan,
  SessionState,
  TaskEvent,
  TaskEventRow,
} from 'src/app/types/pointmotion';
import { environment } from 'src/environments/environment';
import { GqlClientService } from '../gql-client/gql-client.service';
import { DebugService } from './debug/debug.service';

interface ActivityList {
  name: string;
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  sessionId = '';
  patientId = '';
  activities: ActivityList[];
  currentActivity: ActivityState | undefined = undefined;
  nextActivity: ActivityState | undefined = undefined;

  constructor(
    private gql: GqlClientService,
    private store: Store<{ session: SessionState }>,
    private debugService: DebugService,
  ) {
    this.store
      .select((state) => state.session)
      .subscribe((session) => {
        this.sessionId = session.session?.id || '';
        this.patientId = session.session?.patient || '';
        (this.currentActivity = session.currentActivity || undefined),
          (this.nextActivity = session.nextActivity || undefined);
      });

    this.store
      .select((store) => store.session.session?.careplanByCareplan)
      .subscribe((careplan) => {
        this.activities = careplan!.careplan_activities.map((careplan_activity) => {
          return {
            name: careplan_activity.activityByActivity.name,
            id: careplan_activity.activity,
          };
        });
      });
  }

  // TODO: batch events, save them in localStorage and let a webworker process the queue
  async sendEvent(event: AnalyticsEvent) {
    if (this.sessionId) {
      const analyticsRow: AnalyticsRow = {
        patient: this.patientId, // TODO remove hardcoded
        session: this.sessionId, // TODO remove hardcoded
        activity: event.activity,
        task_id: event.task_id,
        task_name: event.task_name,
        attempt_id: event.attempt_id,
        event_type: event.event_type,
        created_at: new Date().getTime(),
        score: event.score,
      };
      return this.gql.req(
        `mutation InsertEvent($patient: uuid, $session: uuid, $activity: uuid, $task_id: uuid, $attempt_id: uuid, $task_name: String, $event_type: String, $created_at: bigint!, $score: float8 ) {
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
      }`,
        analyticsRow,
      );
    }
  }

  async sendSessionEvent(event: AnalyticsSessionEvent) {
    if (this.sessionId) {
      const sessionEventRow: AnalyticsSessionEventRow = {
        patient: this.patientId, // TODO remove hardcoded
        session: this.sessionId, // TODO remove hardcoded
        event_type: event.event_type,
        created_at: new Date().getTime(),
      };

      this.debugService.pushEvent(event);

      if (event.event_type === 'sessionEnded') {
        console.log(this.sendSessionEndedAt());
      }
      return this.gql.req(
        `mutation InsertEvent($patient: uuid, $session: uuid, $event_type: String, $created_at: bigint! ) {
          insert_events_one(object: {
              patient: $patient,
              session: $session,
              event_type: $event_type,
              created_at: $created_at,
          }) {
            id
          }
        }`,
        sessionEventRow,
      );
    }
  }

  async sendActivityEvent(event: ActivityEvent) {
    if (this.sessionId) {
      const activityEventRow: ActivityEventRow = {
        patient: this.patientId, // TODO remove hardcoded
        session: this.sessionId, // TODO remove hardcoded
        activity: event.activity,
        event_type: event.event_type,
        created_at: new Date().getTime(),
      };

      this.debugService.pushEvent(event);

      return this.gql.req(
        `mutation InsertEvent($patient: uuid, $session: uuid, $activity: uuid, $event_type: String, $created_at: bigint! ) {
      insert_events_one(object:
        {
          patient: $patient,
          session: $session,
          activity: $activity,
          event_type: $event_type,
          created_at: $created_at,
        }) {
          id
      }
    }`,
        activityEventRow,
      );
    }
  }

  async sendTaskEvent(event: TaskEvent) {
    if (this.sessionId) {
      const taskEventRow: TaskEventRow = {
        patient: this.patientId, // TODO remove hardcoded
        session: this.sessionId, // TODO remove hardcoded
        activity: event.activity,
        task_id: event.task_id,
        attempt_id: event.attempt_id,
        task_name: event.task_name,
        event_type: event.event_type,
        created_at: new Date().getTime(),
      };

      let isTaskReacted = (event.event_type === 'taskReacted') ? true : false
      this.debugService.pushEvent({
        event_type: event.event_type,
        task_id: event.task_id,
        task_name: event.task_name,
        reacted: isTaskReacted
      })

      if (!(event.score && event.event_type === 'taskEnded')) {
        return this.gql.req(
          `mutation InsertEvent($patient: uuid, $session: uuid, $activity: uuid,$task_id: uuid, $attempt_id: uuid, $task_name: String, $event_type: String, $created_at: bigint! ) {
				insert_events_one(object:
					{
						patient: $patient,
						session: $session,
						activity: $activity,
						task_id: $task_id,
						attempt_id: $attempt_id,
						task_name: $task_name,
						event_type: $event_type,
						created_at: $created_at
					}) {
						id
				}
			}`,
          taskEventRow,
        );
      } else {
        taskEventRow['score'] = event.score;
        return this.gql.req(
          `mutation InsertEvent($patient: uuid, $session: uuid, $activity: uuid, $task_id: uuid, $attempt_id: uuid, $task_name: String, $event_type: String, $created_at: bigint!, $score: float8 ) {
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
			}`,
          taskEventRow,
        );
      }
    }
  }

  async sendSessionEndedAt() {
    if (this.sessionId) {
      const sessionEndedAtRow: { endedAt: Date; sessionId: string } = {
        endedAt: new Date(),
        sessionId: this.sessionId, // TODO remove hardcoded
      };
      return this.gql.req(
        `mutation SetSessionEnded($endedAt: timestamptz = "", $sessionId: uuid = "") {
  		update_session(_set: {endedAt: $endedAt}, where: {id: {_eq: $sessionId}}) {
    		affected_rows
  		}
		}`,
        sessionEndedAtRow,
      );
    }
  }

  async sendSessionState(stage: ActivityStage) {
    if (this.sessionId) {
      const sessionStateRow = {
        state: {
          currentActivity: this.currentActivity,
          nextActivity: this.nextActivity,
          stage: stage,
        },
        id: this.sessionId,
      };
      return this.gql.req(
        `mutation SetSessionState($state: jsonb, $id: uuid) {
          update_session(_set: {state: $state}, where: {id: {_eq: $id}}) {
            affected_rows
          }
        }`,
        sessionStateRow,
      );
    }
  }

  getActivityId(name: string) {
    if (!this.activities) {
      return;
    }
    return this.activities.find((activity) => activity.name === name)?.id;
  }
}
