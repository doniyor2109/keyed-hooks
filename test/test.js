import React, {useState, useEffect} from 'react';
import ReactDOM from 'react-dom';

import {useKeyedHooks} from '../lib';

export function useCustomHook(initialState, key) {
  React.useState(initialState)
}


function Component() {
  const {useKeyedState, useKeyedEffect, useKeyedReducer} = useKeyedHooks();
  const [initial, setInitial] = useState(false);

  if (initial) {
    const [val, setVal] = useKeyedState('Hello World', 'state1');
    console.log(val);

    const [state, dispatch] = useKeyedReducer(function(state, action) {
      return action;
    }, undefined, 'reducer');

    if (!state) {
      dispatch('hello from reducer');
    }

    console.log(state);

    useKeyedEffect(function() {
      console.log('Hello from keyed effect')
      return function() {
        console.log('unsubscribed')
      }
    }, undefined, 'effect1')
  }


   useEffect(function() {
    setInitial(true);
    console.log('--')
  }, []);

  return null;
}

test('', function() {
  const div = document.createElement('div');
  ReactDOM.render(<Component />, div);
  ReactDOM.unmountComponentAtNode(div);
});
