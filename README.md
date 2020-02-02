# @rxreact/context

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Greenkeeper badge](https://badges.greenkeeper.io/rxreact/context.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.com/rxreact/context.svg?branch=master)](https://travis-ci.com/rxreact/context)
[![Coveralls](https://img.shields.io/coveralls/rxreact/context.svg)](https://coveralls.io/github/rxreact/context)

Development Sponsored By:  
[![Carbon Five](./assets/C5_final_logo_horiz.png)](http://www.carbonfive.com)

A project for dependency injecting Signal Graphs into components. Builds on top of [@rxreact/core](https://github.com/rxreact/core).

[Typedocs for @rxreact/context](https://rxreact.github.io/context/)

## Installation

In your project:

```bash
npm install @rxreact/jest-helpers --save
```

or

```bash
yarn add @rxreact/jest-helpers
```

RxJS and Jest are peer dependencies and need to be installed separately.

Then import the library:

```typescript
import { connect, createSignalGraphContext } from "@rxreact/context";
```

## Basic Usage

This library is patterned after Redux, where you have a global store for data and business logic, and individual components can connect to that store, add their own local business logic, then inject the results into components for rendering.

Like with Redux, in testing you may wrap a tree of components with a Provider to inject mock versions of your global store.

You can see a full working sample application [here](./sample).

### Setup Global Store

To set up the `rxreact/context` store, you will need a few pieces: a global `SignalGraph`, a `SignalGraphContext`, and to add the `SignalGraphProvider` to your `App.tsx`.

```typescript
// src/signals/signal-graph.ts
import { Subject } from "rxjs";
import { scan, startWith, shareReplay } from "rxjs/operators";

// For typescript, export a type for use by viewModelFactories
export type SignalGraph = ReturnType<typeof signalGraph>;

/** A function to generate the global signal graph */
export const signalGraph = () => {
  const onClick$ = new Subject<void>();

  // Set up your signal graph
  const clickCount$ = onClick$.pipe(
    scan(count => count + 1, 0),
    startWith(0),
    shareReplay(1)
  );

  // Return all signals you want to expose to components
  return {
    onClick$,
    clickCount$
  };
};
```

```typescript
// src/signals/SignalGraphContext.ts
import { createSignalGraphContext } from "@rxreact/context";
import { signalGraph } from "./SignalGraph";

// Generate and export a context and provider for the graph
export const [SignalGraphContext, SignalGraphProvider] = createSignalGraphContext(signalGraph);
```

```typescript
// src/App.tsx

import * as React from "react";
import { SignalGraphProvider } from "../signals/SignalGraphContext";
import ClickCounter from "./ClickCounter";

const App: React.FunctionComponent = () => {
  return (
    // Any component inside the provider can connect to the graph.
    <SignalGraphProvider>
      <ClickCounter multiple={3} />
    </SignalGraphProvider>
  );
};

export default App;
```

### Connect to store with components

```typescript
import * as React from "react";
import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { getProp, connect } from "@rxreact/context";

import { SignalGraph } from "../signals/SignalGraph";
import { SignalGraphContext } from "../signals/SignalGraphContext";

// Set up an interface for your normal props
export interface ClickCounterProps {
  multiple: number;
}

// Set up a different interface for props passed in from the viewModelFactory (this makes typing the viewModelFactory easier)
export interface ClickCounterSignalProps {
  clickCount: number;
  color: string;
  onClick: () => void;
}

// Your component takes both interfaces as props
export const ClickCounter: React.FunctionComponent<ClickCounterProps & ClickCounterSignalProps> = ({
  color,
  onClick,
  clickCount
}) => {
  return (
    <div>
      <button onClick={onClick}>Click Me</button>
      <p>
        Clicked <span style={{ color }}>{clickCount}</span> times
      </p>
    </div>
  );
};

// Create (and export for testing) a viewModelFactory that has the signal graph dependency injected into it.
export const viewModelFactory = (
  // Pull out individual signals to make it easy to see the dependencies of the component.
  { onClick$, clickCount$ }: SignalGraph,
  // The factory can also take an Observable of external props
  props$: Observable<ClickCounterProps>
) => {
  // Set up any local signals you want
  const multiple$ = props$.pipe(getProp("multiple"));
  const color$: Observable<string> = combineLatest(clickCount$, multiple$).pipe(
    map(([count, multiple$]) => count % multiple$ === 0),
    map(isMultiple => (isMultiple ? "red" : "black"))
  );

  // Inject signals into the component
  return {
    // Values
    inputs: {
      clickCount: clickCount$,
      color: color$
    },
    // Callbacks
    outputs: {
      onClick: onClick$
    }
  };
};

// Default export the connected component, passing in the SignalGraphContext so we know which graph to connect to.
export default connect(SignalGraphContext, viewModelFactory)(ClickCounter);
```
