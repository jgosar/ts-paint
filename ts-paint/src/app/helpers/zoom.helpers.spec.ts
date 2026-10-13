import { getScrollPositionCentredOn } from './zoom.helpers';

describe('getScrollPositionCentredOn', () => {
  it('scrolls so that the zoomed point sits in the middle of the viewport', () => {
    expect(getScrollPositionCentredOn({ w: 200, h: 100 }, 2, { w: 60, h: 40 })).toEqual({ w: 20, h: 30 });
  });

  it('floors to whole pixels and never scrolls past the origin', () => {
    expect(getScrollPositionCentredOn({ w: 201, h: 100 }, 1, { w: 150, h: 10 })).toEqual({ w: 49, h: 0 });
  });
});
