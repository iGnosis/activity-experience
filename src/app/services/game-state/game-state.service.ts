import { Injectable } from '@angular/core';
import { ApiService } from '../checkin/api.service';

@Injectable({
  providedIn: 'root',
})
export class GameStateService {
  constructor(private apiService: ApiService) {}

  // doing this becuase it's a pain to workout dates w.r.t user's timezone server-side...
  async postLoopHook() {
    console.log('game-state:postLoopHook');
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentDate = new Date();
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    startDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    endDate.setHours(24, 0, 0, 0);

    this.apiService.updateRewards(startDate, endDate, userTimezone);
    this.apiService.gameCompleted(startDate, endDate, currentDate, userTimezone);
  }
}
