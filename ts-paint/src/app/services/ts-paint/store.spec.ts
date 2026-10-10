import { Store } from './store';

interface TestState {
  count: number;
  nested?: { deep?: { value: number }; sibling?: string } | null;
  list?: number[];
}

class TestStore extends Store<TestState> {
  constructor(initialState: TestState) {
    super(initialState);
  }
}

function createStore(overrides: Partial<TestState> = {}): TestStore {
  return new TestStore({ count: 0, nested: { deep: { value: 1 }, sibling: 'left alone' }, ...overrides });
}

describe('Store', () => {
  describe('state$', () => {
    it('emits the initial state to a new subscriber', () => {
      const store: TestStore = createStore({ count: 7 });
      const emitted: TestState[] = [];

      store.state$.subscribe((state) => emitted.push(state));

      expect(emitted.length).toBe(1);
      expect(emitted[0].count).toBe(7);
    });

    it('emits every state change', () => {
      const store: TestStore = createStore();
      const counts: number[] = [];
      store.state$.subscribe((state) => counts.push(state.count));

      store.setState({ count: 1 });
      store.patchState(2, 'count');

      expect(counts).toEqual([0, 1, 2]);
    });
  });

  describe('state', () => {
    it('returns the current state synchronously', () => {
      const store: TestStore = createStore({ count: 3 });
      expect(store.state.count).toBe(3);
    });
  });

  describe('setState', () => {
    it('replaces the whole state with the given object', () => {
      const store: TestStore = createStore();
      const next: TestState = { count: 42 };

      store.setState(next);

      expect(store.state).toBe(next);
      expect(store.state.nested).toBeUndefined();
    });
  });

  describe('patchState', () => {
    it('does nothing when no path is given', () => {
      const store: TestStore = createStore();
      const before: TestState = store.state;
      const emissions: TestState[] = [];
      store.state$.subscribe((state) => emissions.push(state));

      store.patchState(99);

      expect(store.state).toBe(before);
      expect(emissions.length).toBe(1);
    });

    it('sets a top level property', () => {
      const store: TestStore = createStore();

      store.patchState(5, 'count');

      expect(store.state.count).toBe(5);
    });

    it('updates a nested path and keeps the other properties', () => {
      const store: TestStore = createStore();

      store.patchState(10, 'nested', 'deep', 'value');

      expect(store.state.nested.deep.value).toBe(10);
      expect(store.state.nested.sibling).toBe('left alone');
      expect(store.state.count).toBe(0);
    });

    it('creates new objects along the patched path but keeps references to untouched siblings', () => {
      const store: TestStore = createStore({ list: [1, 2, 3] });
      const before: TestState = store.state;

      store.patchState(10, 'nested', 'deep', 'value');

      expect(store.state).not.toBe(before);
      expect(store.state.nested).not.toBe(before.nested);
      expect(store.state.nested.deep).not.toBe(before.nested.deep);
      expect(store.state.list).toBe(before.list);
    });

    it('never mutates the previous state object', () => {
      const store: TestStore = createStore();
      const before: TestState = store.state;
      const beforeDeep = before.nested.deep;

      store.patchState(10, 'nested', 'deep', 'value');
      store.patchState(1, 'count');

      expect(before.count).toBe(0);
      expect(beforeDeep.value).toBe(1);
      expect(before.nested.deep).toBe(beforeDeep);
    });

    it('creates missing subtrees when the path goes through undefined', () => {
      const store: TestStore = createStore({ nested: undefined });

      store.patchState(10, 'nested', 'deep', 'value');

      expect(store.state.nested).toEqual({ deep: { value: 10 } });
    });

    it('creates missing subtrees when the path goes through null', () => {
      const store: TestStore = createStore({ nested: null });

      store.patchState(10, 'nested', 'deep', 'value');

      expect(store.state.nested).toEqual({ deep: { value: 10 } });
    });

    it('creates deeply missing subtrees several levels down', () => {
      const store: TestStore = createStore({ nested: { sibling: 'kept' } });

      store.patchState(10, 'nested', 'deep', 'value');

      expect(store.state.nested).toEqual({ sibling: 'kept', deep: { value: 10 } });
    });

    it('accepts numeric keys in the path', () => {
      const store: TestStore = createStore({ list: [1, 2, 3] });

      store.patchState(20, 'list', 1);

      // Quirk: spreading an array into an object literal turns it into a plain object with numeric keys
      expect(store.state.list[1]).toBe(20);
      expect(store.state.list[0]).toBe(1);
      expect(store.state.list[2]).toBe(3);
    });
  });
});
