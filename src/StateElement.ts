import { LitElement, property } from 'lit-element';

import { subscribe, unsubscribe, State, getState } from './state';

export * from 'lit-element';

export class StateElement extends LitElement {
  @property({ type: Object }) get state(): State {
    return getState()
  };

  constructor() {
    super();
    subscribe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    unsubscribe(this);
  }
}
