import { createInitialState, navigatorReducer } from '../navigation/reducer';

describe('createInitialState', () => {
  it('opens the sessions tab on the recording screen when resuming', () => {
    expect(
      createInitialState({ resumeRecording: true }).stacks.sessions
    ).toEqual([{ name: 'session-list' }, { name: 'session-recording' }]);
    expect(createInitialState().stacks.sessions).toEqual([
      { name: 'session-list' },
    ]);
  });
});

describe('navigatorReducer REPLACE', () => {
  it('swaps the top screen of the active stack', () => {
    let state = navigatorReducer(createInitialState(), {
      type: 'SWITCH_TAB',
      tab: 'sessions',
    });
    state = navigatorReducer(state, {
      type: 'PUSH',
      screen: { name: 'session-recording' },
    });
    state = navigatorReducer(state, {
      type: 'REPLACE',
      screen: { name: 'session-detail', sessionId: 's1' },
    });

    expect(state.stacks.sessions).toEqual([
      { name: 'session-list' },
      { name: 'session-detail', sessionId: 's1' },
    ]);
  });

  it('pushes instead of replacing the root screen', () => {
    let state = navigatorReducer(createInitialState(), {
      type: 'SWITCH_TAB',
      tab: 'sessions',
    });
    state = navigatorReducer(state, {
      type: 'REPLACE',
      screen: { name: 'session-detail', sessionId: 's1' },
    });

    expect(state.stacks.sessions).toEqual([
      { name: 'session-list' },
      { name: 'session-detail', sessionId: 's1' },
    ]);
  });
});
