import React from 'react';
import shallowEqualArrays from 'shallow-equal/arrays';

function createUnsubscribe() {
  const unsubscribers = [];

  return {
    add(fn) {
      if (typeof fn === 'function') {
        unsubscribers.push(fn);
      }
    },
    cleanup() {
      unsubscribers.forEach(function(fn) {
        fn();
      });
    }
  };
}

export function useKeyedHooks() {
  const {current: _staticState} = React.useRef({
    initialStates: {},
    initialReducerStates: {},
    initialRender: true,
    refs: {},
    activeEffects: {},
    passiveEffects: {},
    initialCleanupEffects: []
  });
  const [_dynamicState, _dispatch] = React.useReducer(
    dynamicStateReducer,
    {
      states: {},
      reducers: {},
    }
  );

  function dynamicStateReducer(state, _action) {
    switch (_action.type) {
      case 'USE_STATE/SET_STATE':
        return {
          ...state,
          states: {
            ...state.states,
            [_action.key]: _action.val,
          },
        };
      case 'USE_REDUCER/DISPATCH':
        const dispatchedAction = _action.action;
        const reducer = _action.reducer;
        const key = _action.key;
        const currentState = (function() {
          // initial state
          if (state.reducers.hasOwnProperty(_action.key)) {
            return _staticState.initialStates[_action.key];
          }
          return state.reducers[_action.key];
        })();
        return {
          ...state,
          reducers: {
            ...state.reducers,
            [key]: reducer(currentState, dispatchedAction),
          },
        };
      default:
        return state;
    }
  }

  // effects with empty props
  React.useEffect(function() {
    const unsubscribers = createUnsubscribe();
    for (const key in _staticState.passiveEffects) {
      const effect = _staticState.passiveEffects[key];
      unsubscribers.add(effect());
    }
    return unsubscribers.cleanup;
  }, []);

  React.useEffect(function() {
    const unsubscribers = createUnsubscribe();
    console.log('---internal-effect')

    for (const key in _staticState.activeEffects) {
      const effect = _staticState.activeEffects[key];

      if (_staticState.initialRender) {
        unsubscribers.add(effect.fn());
      }
      // effects without props
      else if (!effect.currProps) {
        unsubscribers.add(effect.fn());
      }
      // effects with props
      else if (!shallowEqualArrays(effect.prevProps, effect.currProps)) {
        unsubscribers.add(effect.fn());
      }
    }
    if (_staticState.initialRender) {
      _staticState.initialRender = false;
    }
    return unsubscribers.cleanup;
  });

  function _setState(key) {
    return function(val) {
      _dispatch({type: 'USE_STATE/SET_STATE', key, val});
    }
  }

  function useKeyedState(initialState, key) {
    if (_dynamicState.states.hasOwnProperty(key)) {
      return [_dynamicState.states[key], _setState(key)]
    } else {
      return [initialState, _setState(key)];
    }
  }

  function useKeyedEffect(fn, props, key) {
    const effectType = !props || props.length ? 'activeEffects' : 'passiveEffects';
    _staticState[effectType][key] = {
      fn,
      prevProps: _staticState.activeEffects[key] && _staticState.activeEffects[key].currProps,
      currProps: props,
    };
  }

  function _reducerDispatch(key, reducer) {
    return function(action) {
      _dispatch({type: 'USE_REDUCER/DISPATCH', key, reducer, action});
    }
  }

  function useKeyedReducer(reducer, initialState, key) {
    _staticState.initialReducerStates[key] = initialState;
    if (!_dynamicState.reducers.hasOwnProperty(key)) {
      return [initialState, _reducerDispatch(key, reducer)];
    } else {
      return [_dynamicState.reducers[key], _reducerDispatch(key, reducer)];
    }
  }

  function useKeyedRef(initialValue, key) {
    if (!_staticState.refs.has(key)) {
      _staticState.refs[key] = initialValue;
    }

    return {current: _staticState.refs[key]};
  }
  return {
    useKeyedState,
    useKeyedEffect,
    useKeyedReducer,
    useKeyedRef,
  };
}



