import * as React from "react";
import { Observable, Subscription } from "rxjs";
import { withViewModel, ViewModel, Difference, ActionMap } from "@rxreact/core";

type NonSignalGraphProps<Props, Selectors, Actions, OwnProps> = Difference<
  Props,
  Selectors & ActionMap<Actions>
> &
  OwnProps;

export type ConnectViewModel<Selectors, Actions> = ViewModel<Selectors, Actions> & {
  unsubscribe?: Subscription[];
};

export function connect<SignalGraph, Selectors, Actions, OwnProps>(
  context: React.Context<SignalGraph>,
  viewModelFactory: (
    signalGraph: SignalGraph,
    ownProps: Observable<OwnProps>
  ) => ConnectViewModel<Selectors, Actions>
) {
  return function connectWithComponent<Props extends Selectors & ActionMap<Actions> & OwnProps>(
    Component: React.ComponentType<Props>
  ) {
    // The final component takes all the props of `component`,
    // _except_ the ones passed in from the Signal Graph.
    const Connected: React.FunctionComponent<NonSignalGraphProps<
      Props,
      Selectors,
      Actions,
      OwnProps
    >> = props => {
      // The Child component to render
      const [{ Child }, setChild] = React.useState<{
        Child: React.ComponentClass<
          NonSignalGraphProps<Props, Selectors, Actions, OwnProps>
        > | null;
      }>({ Child: null });

      const [localSubscriptions, setLocalSubscriptions] = React.useState<Subscription[] | null>(
        null
      );

      const signalGraph = React.useContext(context);

      // Wrap the child with `withViewModel`, but only do this once.
      React.useEffect(() => {
        const child = withViewModel((ownProps: Observable<OwnProps>) => {
          const { inputs, outputs, unsubscribe } = viewModelFactory(signalGraph, ownProps);

          // Store the unsubscribes for cleanup.
          setLocalSubscriptions(unsubscribe || null);

          return { inputs, outputs };
        })(Component);
        // Wrap the child in an object, because `setChild` when passed a
        // function (like a component) will actually call the function.
        setChild({ Child: child });
      }, [signalGraph]);

      // On destroy, perform cleanup
      React.useEffect(() => {
        return () => {
          if (localSubscriptions) {
            localSubscriptions.map(subscription => subscription.unsubscribe());
          }
        };
      }, [localSubscriptions]);

      return Child ? <Child {...props} /> : null;
    };

    return Connected;
  };
}

/**
 * Generate a SignalGraph context and provider to serve connected components.
 * @param createSignalGraph - A function to generate the signal graph
 */
export function createSignalGraphContext<T>(
  createSignalGraph: () => T
): [React.Context<T>, React.FunctionComponent] {
  const signalGraph = createSignalGraph();
  const SignalGraphContext = React.createContext(signalGraph);

  const SignalGraphProvider: React.FunctionComponent = ({ children }) => {
    return (
      <SignalGraphContext.Provider value={signalGraph}>{children}</SignalGraphContext.Provider>
    );
  };

  return [SignalGraphContext, SignalGraphProvider];
}
