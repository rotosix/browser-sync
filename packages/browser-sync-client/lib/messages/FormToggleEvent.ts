import { OutgoingSocketEvents } from "../socket-messages";
import * as ClickEvent from "./ClickEvent";
import { Inputs } from "../index";
import { pluck } from "rxjs/operators";
import { filter } from "rxjs/operators";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { withLatestFrom } from "rxjs/operators";
import { setElementToggleValue } from "../effects/set-element-toggle-value.effect";

export interface Payload {
    tagName: string;
    index: number;
    value: any;
    type: any;
    checked: any;
}

export type OutgoingPayload = Payload;

export interface IncomingPayload extends OutgoingPayload {
    pathname: string;
}

export function outgoing(
    element: ClickEvent.ElementData,
    props: { value: string; type: string; checked: boolean }
): [OutgoingSocketEvents.InputToggle, OutgoingPayload] {
    return [
        OutgoingSocketEvents.InputToggle,
        {
            ...element,
            ...props
        }
    ];
}

export function incomingInputsToggles(
    xs: Observable<IncomingPayload>,
    inputs: Inputs
) {
    return xs.pipe(
        withLatestFrom(
            inputs.option$.pipe(pluck("ghostMode", "forms", "toggles")),
            inputs.window$.pipe(pluck("location", "pathname"))
        ),
        filter(([, toggles]) => toggles === true),
        map(([event]) => setElementToggleValue(event))
    );
}
