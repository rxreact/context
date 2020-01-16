import { createSignalGraphContext } from "@rxreact/context";
import { signalGraph } from "./SignalGraph";

export const [SignalGraphContext, SignalGraphProvider] = createSignalGraphContext(signalGraph);
