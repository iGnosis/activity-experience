import { TestBed } from '@angular/core/testing';

import { PoseModelAdapter } from './pose-model-adapter.service';

describe('PoseModelAdapterService', () => {
  let service: PoseModelAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoseModelAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
