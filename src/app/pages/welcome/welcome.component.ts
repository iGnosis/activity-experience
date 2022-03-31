import { Component, OnInit } from '@angular/core';
import { filter, Observable, pipe } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { calibration } from 'src/app/store/actions/calibration.actions';
import { testStringAction } from 'src/app/store/actions/test.action';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  test$?: Observable<string>
  // test$? = Observable<String>

  constructor(private store: Store<{test: {name: string, age: number}}>) {
    
    this.test$ = store.select((state) => state.test.name)
    this.test$.subscribe(name => {
      console.log('new name', name);
      
    })
    // this.test$.subscribe(value => {
    //   console.log(value);
    // })

  }

  ngOnInit(): void {
  }

  invalid() {
    this.store.dispatch(testStringAction({name: 'Aman', age: 20}))
  }

  noPerson() {
    this.store.dispatch(testStringAction({name: 'Gautam', age: 21}))
  }
}
