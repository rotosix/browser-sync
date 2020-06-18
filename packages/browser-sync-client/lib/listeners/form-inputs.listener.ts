import { IncomingSocketNames, OutgoingSocketEvent } from "../socket-messages";
import { getElementData } from "../browser.utils";
import { Observable } from "rxjs";
import { createTimedBooleanSwitch } from "../utils";
import * as KeyupEvent from "../messages/KeyupEvent";
import { filter } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { map } from "rxjs/operators";
import { pluck } from "rxjs/operators";
import { skip } from "rxjs/operators";
import { distinctUntilChanged } from "rxjs/operators";
import { switchMap } from "rxjs/operators";
import { EMPTY } from "rxjs";
import { fromEvent } from "rxjs";
import { Inputs } from "../index";

export function getFormInputStream(
    document: Document,
    socket$: Inputs["socket$"],
    option$: Inputs["option$"]
): Observable<OutgoingSocketEvent> {
    const canSync$ = createTimedBooleanSwitch(
        socket$.pipe(filter(([name]) => name === IncomingSocketNames.Keyup))
    );
    return option$.pipe(
        skip(1), // initial option set before the connection event
        pluck("ghostMode", "forms", "inputs"),
        distinctUntilChanged(),
        switchMap(formInputs => {
            if (!formInputs) {
                return EMPTY;
            }
            return fromEvent(document.body, "keyup").pipe(
                map((e: Event) => e.target || e.currentTarget),
                filter(
                    (target: Element) =>
                        target.tagName === "INPUT" ||
                        target.tagName === "TEXTAREA"
                ),
                withLatestFrom(canSync$),
                filter(([, canSync]) => Boolean(canSync)),
                map(([eventTarget]) => {
                    const target = getElementData(eventTarget);
                    // @ts-ignore
                    const value = eventTarget.value;
                    return KeyupEvent.outgoing(target, value);
                })
            );
        })
    );
}
