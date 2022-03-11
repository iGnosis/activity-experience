import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  calibration$?: Observable<String>
  frame$?: Observable<any>

  constructor(private store: Store<{calibration: String, frame: String}>) {
    this.calibration$ = store.select('calibration')
    this.frame$ = store.select('frame')
    this.frame$.subscribe((result) => {
      // console.log(result)
    })
  }

  ngOnInit(): void {
  }

  invalid() {
    this.store.dispatch(calibration.invalid())
  }

  noPerson() {
    this.store.dispatch(calibration.noPersonDetected())
  }
}
