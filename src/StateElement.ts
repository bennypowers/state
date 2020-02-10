import type { State } from './state';

import { LitElement, property } from 'lit-element';

import { getState } from './state';
import { StateMixin } from './StateMixin';

export class StateElement extends StateMixin(LitElement) {
  /** l'état c'est moi */
  @property({ type: Object }) get state(): State {
    return getState();
  }
}
