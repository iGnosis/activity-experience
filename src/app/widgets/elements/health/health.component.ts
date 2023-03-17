import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HealthService } from 'src/app/services/elements/health/health.service';
import { ElementAttributes, HealthElementState } from 'src/app/types/pointmotion';

@Component({
  selector: 'element-health',
  templateUrl: './health.component.html',
  styleUrls: ['./health.component.scss'],
})
export class HealthComponent implements OnInit {
  state: { data: HealthElementState; attributes: ElementAttributes };
  subscription: Subscription;
  total: number[];

  constructor(private healthService: HealthService) {}

  ngOnInit(): void {
    this.state = { ...this.healthService.state };
    this.total = Array(this.state.data.total).fill(0);
    this.subscription = this.healthService.subject.subscribe((value) => {
      this.state = { ...value };
      this.total = Array(this.state.data.total).fill(0);
    });
  }
}
