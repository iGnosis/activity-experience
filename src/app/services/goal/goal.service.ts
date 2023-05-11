import { Injectable } from '@angular/core';
import { GqlClientService } from '../gql-client/gql-client.service';
import { GqlConstants } from '../gql-constants';
import { Badge, Goal, UserContext } from 'src/app/types/pointmotion';

@Injectable({
  providedIn: 'root',
})
export class GoalService {
  constructor(private gqlService: GqlClientService) {}

  private goal?: Goal;

  setGoal(goal: Goal) {
    this.goal = goal;
  }

  getGoal() {
    return this.goal;
  }

  async generateGoals(gameName: string) {
    return await this.gqlService.req(GqlConstants.GENERATE_GOALS, { gameName });
  }

  async getUserContext(patientId: string): Promise<UserContext> {
    // const resp = await this.gqlService.req(GqlConstants.GET_USER_CONTEXT, { patientId });
    // return resp.patient_by_pk.context;
    return {};
  }

  getUnlockedBadges(goal: Partial<Goal>, currentContext: { [key: string]: number }) {
    const { id, name } = goal.rewards![0];
    const badges: Partial<Badge>[] = [];
    if (this.isGoalReached(goal, currentContext)) {
      badges.push({
        id: id!,
        name: name!,
      });
    }
    return badges;
  }

  isGoalReached(goal: Partial<Goal>, currentContext: { [key: string]: number }) {
    const { metric, minVal } = goal.rewards![0];
    const currentValue = currentContext[metric!];
    return currentValue >= minVal!;
  }
}
