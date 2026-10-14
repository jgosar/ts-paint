import { getScrollPositionAnchoredOn, getScrollPositionCentredOn } from './zoom.helpers';

describe('getScrollPositionCentredOn', () => {
  it('scrolls so that the zoomed point sits in the middle of the viewport', () => {
    expect(getScrollPositionCentredOn({ w: 200, h: 100 }, 2, { w: 60, h: 40 })).toEqual({ w: 20, h: 30 });
  });

  it('floors to whole pixels and never scrolls past the origin', () => {
    expect(getScrollPositionCentredOn({ w: 201, h: 100 }, 1, { w: 150, h: 10 })).toEqual({ w: 49, h: 0 });
  });
});

describe('getScrollPositionAnchoredOn', () => {
  it('keeps the anchor where it is on screen through a zoom step', () => {
    // At zoom 1 and scroll 0 the anchor is 60px from the left of the viewport; at zoom 2 it is at 120px in the
    // content, so the viewport must scroll by 60px to keep it 60px from the left
    expect(getScrollPositionAnchoredOn({ w: 0, h: 0 }, 1, 2, { w: 60, h: 40 }, { w: 60, h: 40 })).toEqual({
      w: 60,
      h: 40,
    });
    expect(getScrollPositionAnchoredOn({ w: 60, h: 40 }, 2, 1, { w: 60, h: 40 }, { w: 60, h: 40 })).toEqual({
      w: 0,
      h: 0,
    });
  });

  it('pans by the distance the fingers moved away from the anchor, in zoomed pixels', () => {
    expect(getScrollPositionAnchoredOn({ w: 100, h: 100 }, 2, 2, { w: 60, h: 40 }, { w: 50, h: 45 })).toEqual({
      w: 120,
      h: 90,
    });
  });

  it('rounds to whole pixels and never scrolls past the origin', () => {
    expect(getScrollPositionAnchoredOn({ w: 0, h: 0 }, 1, 2, { w: 10.3, h: 0.2 }, { w: 10.3, h: 50 })).toEqual({
      w: 10,
      h: 0,
    });
  });
});
