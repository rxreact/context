import * as React from "react";
import { Observable, combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { getProp, connect } from "@rxreact/context";

import { SignalGraph } from "../signals/SignalGraph";
import { SignalGraphContext } from "../signals/SignalGraphContext";

export interface ClickCounterProps {
  multiple: number;
}

export interface ClickCounterSignalProps {
  clickCount: number;
  color: string;
  onClick: () => void;
}

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

export const viewModelFactory = (
  { onClick$, clickCount$ }: SignalGraph,
  props$: Observable<ClickCounterProps>
) => {
  const multiple$ = props$.pipe(getProp("multiple"));
  const color$: Observable<string> = combineLatest(clickCount$, multiple$).pipe(
    map(([count, multiple$]) => count % multiple$ === 0),
    map(isMultiple => (isMultiple ? "red" : "black"))
  );

  return {
    inputs: {
      clickCount: clickCount$,
      color: color$
    },
    outputs: {
      onClick: onClick$
    }
  };
};

export default connect(SignalGraphContext, viewModelFactory)(ClickCounter);
