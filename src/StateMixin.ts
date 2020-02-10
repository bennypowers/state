/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import type { State } from './state';

import { subscribe, unsubscribe } from './state';

type Constructor<T = {}> = new (...args: any[]) => T;

interface CustomElement {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  attributeChangedCallback?(name: string, oldVal: string, newVal: string): void;
  adoptedCallback?(): void;
}

export interface StatefulElement {
  state: State;
}

export function StateMixin<
  Base extends Constructor<CustomElement>
>(superclass: Base) {
  return class StateMixinClass extends superclass implements StatefulElement {
    state: State;

    /** @inheritdoc */
    constructor(...args: any[]) {
      super(...args);
      subscribe(this);
    }

    /** @inheritdoc */
    disconnectedCallback(): void {
      if (super.disconnectedCallback) super.disconnectedCallback();
      unsubscribe(this);
    }
  };
}
