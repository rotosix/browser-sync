import { createTimedBooleanSwitch } from "../utils";
import { IncomingSocketNames, OutgoingSocketEvent } from "../socket-messages";
import { getElementData } from "../browser.utils";
import { Observable } from "rxjs";
import * as ClickEvent from "../messages/ClickEvent";
import { withLatestFrom } from "rxjs/operators";
import { filter } from "rxjs/operators";
import { map } from "rxjs/operators";
import { Inputs } from "../index";
import { pluck } from "rxjs/operators";
import { skip } from "rxjs/operators";
import { distinctUntilChanged } from "rxjs/operators";
import { switchMap } from "rxjs/operators";
import { fromEvent } from "rxjs";
import { EMPTY } from "rxjs";

export function getClickStream(
    document: Document,
    socket$: Inputs["socket$"],
    option$: Inputs["option$"]
): Observable<OutgoingSocketEvent> {
    const canSync$ = createTimedBooleanSwitch(
        socket$.pipe(filter(([name]) => name === IncomingSocketNames.Click))
    );

    return option$.pipe(
        skip(1), // initial option set before the connection event
        pluck("ghostMode", "clicks"),
        distinctUntilChanged(),
        switchMap(canClick => {
            if (!canClick) {
                return EMPTY;
            }
            return fromEvent(document, "click").pipe(
                map((e: Event) => e.target),
                filter((target: any) => {
                    if (target.tagName === "LABEL") {
                        const id = target.getAttribute("for");
                        if (id && document.getElementById(id)) {
                            return false;
                        }
                    }
                    return true;
                }),
                withLatestFrom(canSync$),
                filter(([, canSync]) => Boolean(canSync)),
                map(([target]): OutgoingSocketEvent => {
                    return ClickEvent.outgoing(getElementData(target));
                })
            );
        })
    );
}
