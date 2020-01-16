import * as React from "react";
import { Subject, of } from "rxjs";
import { shallow, mount, ShallowWrapper, ReactWrapper } from "enzyme";

import ConnectedClickCounter, {
  ClickCounter,
  viewModelFactory,
  ClickCounterSignalProps,
  ClickCounterProps
} from "./ClickCounter";
import { signalGraph, SignalGraph } from "../signals/SignalGraph";
import { SignalGraphContext } from "../signals/SignalGraphContext";
import { watchSignal } from "../test/signals";

describe("ClickCounter", () => {
  describe("mount connected component test", () => {
    let wrapper: ReactWrapper;
    let props: ClickCounterProps;
    let signals: SignalGraph;

    beforeEach(() => {
      signals = {
        ...signalGraph()
      };

      props = {
        multiple: 3
      };

      wrapper = mount(
        <SignalGraphContext.Provider value={signals}>
          <ConnectedClickCounter {...props} />
        </SignalGraphContext.Provider>
      );
    });

    it("starts with 0 clicks", () => {
      expect(wrapper.text()).toContain("Clicked 0 times");
    });

    it("increments on click", () => {
      wrapper.find("button").simulate("click");
      wrapper.find("button").simulate("click");

      expect(wrapper.text()).toContain("Clicked 2 times");
    });
    it("does not highlight when it is not a multiple", () => {
      wrapper.find("button").simulate("click");
      wrapper.find("button").simulate("click");

      expect(wrapper.text()).toContain("Clicked 2 times");
      expect(wrapper.find("span").prop("style")).toEqual({ color: "black" });
    });

    it("highlights when it is a multiple", () => {
      wrapper.find("button").simulate("click");
      wrapper.find("button").simulate("click");
      wrapper.find("button").simulate("click");

      expect(wrapper.text()).toContain("Clicked 3 times");
      expect(wrapper.find("span").prop("style")).toEqual({ color: "red" });
    });
  });

  describe("shallow component test", () => {
    let wrapper: ShallowWrapper;
    let props: ClickCounterProps & ClickCounterSignalProps;

    beforeEach(() => {
      props = {
        multiple: 3,
        clickCount: 6,
        color: "red",
        onClick: jest.fn()
      };

      wrapper = shallow(<ClickCounter {...props} />);
    });

    it("renders the count", () => {
      expect(wrapper.text()).toContain("Clicked 6 times");
    });

    it("triggers an event on click", () => {
      wrapper.find("button").simulate("click");

      expect(props.onClick).toHaveBeenCalled();
    });

    it("shows the text in the correct color", () => {
      wrapper.find("button").simulate("click");

      expect(wrapper.find("span").prop("style")).toEqual({ color: "red" });
    });
  });

  describe("viewModelFactory", () => {
    let props: ClickCounterProps;
    let signals: SignalGraph;

    const onClick$ = new Subject<void>();

    beforeEach(() => {
      signals = {
        ...signalGraph(),
        clickCount$: of(0),
        onClick$
      };

      props = {
        multiple: 3
      };
    });

    const generateGraph = () => viewModelFactory(signals, of(props));

    it("is black when the count is not a multiple of the prop", () => {
      signals.clickCount$ = of(5);
      props.multiple = 3;

      const graph = generateGraph();
      const color$ = watchSignal(graph.inputs.color);

      expect(color$).toEmitValue("black");
    });

    it("is red when the count is a multiple of the prop", () => {
      signals.clickCount$ = of(6);
      props.multiple = 3;

      const graph = generateGraph();
      const color$ = watchSignal(graph.inputs.color);

      expect(color$).toEmitValue("red");
    });
  });
});
