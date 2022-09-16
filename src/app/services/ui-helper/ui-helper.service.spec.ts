import { flush, TestBed } from '@angular/core/testing';

import { UiHelperService } from './ui-helper.service';

describe('UiHelperService', () => {
  let service: UiHelperService;

  // mock datat to test with
  const width = 1280;
  const height = 720;
  const windowInnerHeight = 962;
  const windowInnerWidth = 1903;
  const resultBoundingBox = {
    topLeft: {
      x: 96,
      y: 0,
    },
    topRight: {
      x: 1807,
      y: 0,
    },
    bottomLeft: {
      x: 96,
      y: 962,
    },
    bottomRight: {
      x: 1807,
      y: 962,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set bounding box', () => {
    const boundingBox = service.setBoundingBox(width, height, {
      innerHeight: windowInnerHeight,
      innerWidth: windowInnerWidth,
    });
    expect(boundingBox).toEqual(resultBoundingBox);
  });

  it('should get bounding box', () => {
    service.setBoundingBox(width, height, {
      innerHeight: windowInnerHeight,
      innerWidth: windowInnerWidth,
    });
    const boundingBox = service.getBoundingBox();
    expect(boundingBox).toEqual(resultBoundingBox);
  });
});
