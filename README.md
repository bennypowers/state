# `@power-elements/state`

A lazy, explicit, typed, and tiny one-way state management library.

👼 [Born *Lazy*](#born-lazy)  
⛲️ [Unidirectional *State*](#unidirectional-state)  
🎇 [Explicit *Effects*](#explicit-effects)  
⌨️ [Well *Typed*](#well-typed)  
👌 [Itsy *Bitsy*](#itsy-bitsy)

## Born Lazy
The only way to define state with this library is *lazily*
```js
// main.js, our app's entrypoint
import { registerState } from '@power-elements/state';

// initial app state. eagerly loaded
registerState({
  auth: {
    state: { user: null }
  }
})
```

By calling `registerState` in dynamicall-imported modules, you can lazily register their slice of state.

This also lets you localize component state with their element definitions, which may make it easier to focus on the task at hand. For example, this `app-home` component definition is lazily-loaded along with its state.

```js
// app-home/app-home.js
import { StateElement, registerState, customElement } from '@power-elements/state';

registerState({
  home: {
    state: { selected: null },
  }
})

@customElement('app-home')
class AppHome extends StateElement {/*..*/}
```

## Unidirectional State

`state` is a read-only property on `StatefulElement`s. Change you're app's state with the `updateState` function, which takes a partial of a partial of the State.

```js
// app-edit-profile/app-edit-profile.js
import '@material/mwc-textfield';

import {
  customElement,
  html,
  registerState,
  updateState,
  StateElement,
} from '@power-elements/state';

registerState({
  editProfile: {
    state: {
      name: null,
      picture: null,
    },
  }
})

@customElement('app-edit-profile')
class AppEditProfile extends StateElement {
  render() {
    const {
      auth: { user },
      editProfile: { name, picture }
    } = this.state;

    if (!user)
      return html`<a href="/login">Login</a>`
    else
      return html`
        <h2>Edit Your Profile, ${user.displayName}</h2>
        <mwc-textfield label="Name" @change="${this.onChange}" .value="${name}"></mwc-textfield>
        <mwc-textfield label="Picture" @change="${this.onChange}" .value="${picture}"></mwc-textfield>
      `;
  }

  onChange({ target: { label, value } }) {
    updateState({ editProfile: { [label.toLowerCase()]: value } });
  }
}
```

## Explicit Effects

If you want to run side effects as a result of state changes, pass an `effects` property to your slice' initializer.

The `effects` property can be a binary function or an array of binary functions; they take the next local state slice and the previous global state.

Effects run before the state tree or components updates.

```js
// router.js
import { registerState, updateState } from '@power-elements/state';

import { installRouter } from '@polymer/pwa-helpers/router';

const lazyLoad = ({ page }) => import(`../app-${page}/app-${page}.js`),

registerState({
  router: {
    state: { page: null },
    effects: lazyLoad
  }
})

installRouter(function(location) {
  const [, page] = location.pathname.split('/')
  updateState({ router: { page } });
})
```

```js
// app-checkout/app-checkout.js
import { registerState, updateState } from '@power-elements/state';

const handleAsJson = response => response.json();

// postCharge :: { token, productId } -> { response?: PaymentResponse, error?: Error }

async function paymentEffect({ token, response, error }, { home = {} }) {
  if (response || error || !token) return;
  const { selected: { id: productId } = {} } = home;
  const { subscribe } = await postCharge({ token, productId })
    .then(subscribe => ({ subscribe }));
  updateState({ subscribe: { response, error } });
}

registerState({
  subscribe: {
    effects: paymentEffect,
    state: {
      token: null,
      response: null,
      error: null,
    },
  },
});

// define element which generates `token` when customer checks out
```

## Well-Typed

`@power-elements/state` gets its types from the `State` interface on the `@power-elements/state/state` module. Merge your app's state in by adding "ambient" declaration files to your components' directories to enjoy some sweet-sweet type safety and IDE perks.

```ts
// app-checkout/index.d.ts
import { Token } from '@types/payment-bros';
import { PaymentResponse, PaymentError } from '../server/typings'

declare module '@power-elements/state/state' {
  interface CheckoutState {
    token?: PaymentBros.Token;
    response?: PaymentResponse;
    error?: Error | PaymentError;
  }

  interface State {
    checkout? CheckoutState;
  }
}
```

## Itsy Bitsy

You get this for ~750 bytes, minified and GZipped.
