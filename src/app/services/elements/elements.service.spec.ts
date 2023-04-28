import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ElementsService } from './elements.service';

describe('ElementsService', () => {
  let service: ElementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should sleep for timeout', fakeAsync(() => {
    let x = 10;
    service.sleep(1000).then(() => {
      x = 20;
    });
    tick(500);

    expect(x).toBe(10);

    tick(500);

    expect(x).toBe(20);
  }));

  it('should give elements observables', () => {
    const result = service.getElementsObservables();

    expect(result).toEqual(jasmine.any(Object));
    expect(Object.keys(result).length).toEqual(15);
  });

  it('should give elements state', () => {
    const result = service.getElementsState();

    expect(result).toEqual(jasmine.any(Object));
    expect(Object.keys(result).length).toEqual(15);
  });
});
