# @pwrs/state

A lazy, explicit, typed, 1kb one-way state management library.

- 👌 [Itsy *Bitsy*](#itsy-bitsy)
- 👼 [Born *Lazy*](#born-lazy)
- ⛲️ [Unidirectional *State*](#unidirectional-state)
- 🎇 [With Explicit *Effects*](#explicit-effects)
- ⌨️ [That's Well *Typed*](#well-typed)

## Itsy Bitsy

1kb is not a tremendous amount over the wire.

## Born Lazy
import the `registerState` function to declare an initial state for your app.

Register state takes an object of state keys, which hold an object of state and optionally effects.

What that means is that if you want your initial state to look like this:
```js
{
  auth: { user: null }
  router: { page: 'home' }
}
```

Then call `registerState` like so:
```js
// main.js, our app's entrypoint
import { registerState } from '@pwrs/state';

// initial app state. eagerly loaded
registerState({
  auth: {
    state: { user: null }
  },
  router: {
    state: { page: 'home' }
  }
});
```

You can declare the entire initial state of you app in one go in this way, but it's much better to declare your state *lazily* by putting your calls to `registerState` in dynamically-imported modules. That way, you don't have to load the state management code for a page until the user navigates to it.

By calling `registerState` in dynamically-imported modules, you can register their slice of state when you load the module, instead of having to know in advance.

This also lets you keep your component state close by to their element definitions. That might make it easier to focus on the task at hand. For example, this `app-home` component definition is lazily-loaded along with its state.

```js
// app-home/app-home.js
import { StateElement, registerState, customElement } from '@pwrs/state';

registerState({
  home: {
    state: { selected: null },
  }
})

@customElement('app-home')
class AppHome extends StateElement {/*..*/}
```

## Unidirectional State

`state` is a read-only property on `StatefulElement`s. In order to affect change in your app's state, call the `updateState` function with a partial representation of the new state.

```js
// app-edit-profile/app-edit-profile.js
import '@material/mwc-textfield';
import { customElement, html } from 'lit-element';
import { registerState, StateElement, updateState } from '@pwrs/state';

registerState({
  editProfile: {
    state: {
      name: null,
      picture: null,
    },
  }
})

@customElement('app-edit-profile') class AppEditProfile extends StateElement {
  render() {
    if (!user)
      return html`<a href="/login">Login</a>`
    else
      return html`
        <h2>Edit Your Profile, ${(this.state.auth?.user?.name ?? 'Friend!')}</h2>

        <mwc-textfield label="Name" @change="${this.onChange}"
            .value="${(this.state.auth?.user?.name ?? '')}"
        ></mwc-textfield>

        <mwc-textfield label="Picture" @change="${this.onChange}"
            .value="${(this.state.auth?.user?.picture ?? '')}"
        ></mwc-textfield>
      `;
  }

  onChange({ target: { label, value } }) {
    updateState({ editProfile: { [label.toLowerCase()]: value } });
  }
}
```

## Explicit Effects

Effects are functions that run whenever the state changes. Register effects by
passing an `effects` property to your slice' initializer.

Effects are ternary functions that take their next local state slice, the previous local state slice, and the global state. They have no return value. They run *after* the new state is assigned.

### Simple Effects
Simple effects perform some task every time the state changes. This example shows how a simple router set up can register an effect which lazy-loads page components.

```js
import { registerState, updateState } from '@pwrs/state';

const lazyLoad = ({ page }) => page && import(`../app-${page}/app-${page}.js`),

registerState({
  router: {
    state: { page: null },
    effects: lazyLoad
  }
});
```

### Declarative Effects

Most effects you write will have some predicate that drives their behaviour. We've provided some logic functions to help you write declarative effects

```js
// app-checkout/app-checkout.js
import { registerState, updateState, when, and, not, or } from '@pwrs/state';

const hasProp = name => o => o[prop] != null;
const hasToken = hasProp('token')
const hasResponse = hasProp('response')
const hasResponse = hasProp('error')

async function paymentEffect({ token, productId }) {
  const { data: response, error } = await postCharge({ token, productId });
  updateState({ subscribe: { response, error } });
}

registerState({
  subscribe: {
    state: { error: null, response: null, token: null, productId: null },
    effects: when(
        and(hasToken,
          and(hasProductId,
            not(or(hasResponse,
                   hasError)))), paymentEffect),
  },
});
```

You can stack these up as well in an array of effects functions:

```js
const initialSearchParams = new URLSearchParams(location.search);

registerState({
  router: {
    state: { hash: '', page: 'home', searchParams: initialSearchParams },
    effects: [
      lazyLoadPages,
      when(hasDocumentIdParam, updateDocumentState),
      when(isHomePage, scrollHomeToHash),
      when(isHomePage, startScrollSpy),
      when(not(isHomePage), disconnectScrollSpy),
      when(and(isAccountPage, isUserLoggedIn), fetchProfile),
    ],
  },
});
```

These helpers were heavily inspired by [crocks](https://crocks.dev). Go check them out.

#### Debugging with `trace()`

import `trace` to debug your state:

```js
import { registerState, trace } from '@pwrs/state';

registerState({
  launchControl: {
    effects: when(isUnderAttack, trace('Under Attack?')),
    state: { misslesIncoming: false, launchCoordinates: null }
  }
});
```

`trace` will log the message you provide it, followed by the contents of the state slice.

## Well-Typed

`@pwrs/state` gets its types from the `State` interface on the `@pwrs/state/state` module. Use Typescript's [Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) to merge your app's state in.

If you're not writing typescript you can still benefit by putting those declarations in an "ambient" declaration file.

```ts
// app-checkout/app-checkout.ts
import type { PaymentBros } from '@types/payment-bros';
import type { PaymentResponse, PaymentError } from '../server/typings'
import { registerState } from '@pwrs/state';

interface CheckoutState {
  token: PaymentBros.Token;
  response: PaymentResponse;
  error: Error | PaymentError;
}

declare module '@pwrs/state/state' {
  interface State {
    checkout: CheckoutState;
  }
}

registerState({
  checkout: {
    state: { token: null, response: null, error: null }
  }
})
```
