import { IncomingSocketNames, OutgoingSocketEvent } from "../socket-messages";
import { getElementData } from "../browser.utils";
import { Observable } from "rxjs";
import { createTimedBooleanSwitch } from "../utils";
import * as FormToggleEvent from "../messages/FormToggleEvent";
import { filter } from "rxjs/operators";
import { skip } from "rxjs/operators";
import { pluck } from "rxjs/operators";
import { distinctUntilChanged } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { map } from "rxjs/operators";
import { switchMap } from "rxjs/operators";
import { Inputs } from "../index";
import { EMPTY } from "rxjs";
import { fromEvent } from "rxjs";

export function getFormTogglesStream(
    document: Document,
    socket$: Inputs["socket$"],
    option$: Inputs["option$"]
): Observable<OutgoingSocketEvent> {
    const canSync$ = createTimedBooleanSwitch(
        socket$.pipe(
            filter(([name]) => name === IncomingSocketNames.InputToggle)
        )
    );

    return option$.pipe(
        skip(1),
        pluck("ghostMode", "forms", "toggles"),
        distinctUntilChanged(),
        switchMap(canToggle => {
            if (!canToggle) {
                return EMPTY;
            }
            return fromEvent(document, "change").pipe(
                map((e: Event) => e.target || e.currentTarget),
                filter((elem: HTMLInputElement) => elem.tagName === "SELECT"),
                withLatestFrom(canSync$),
                filter(([, canSync]) => Boolean(canSync)),
                map(([elem, canSync]: [HTMLInputElement, boolean]) => {
                    const data = getElementData(elem);

                    return FormToggleEvent.outgoing(data, {
                        type: elem.type,
                        checked: elem.checked,
                        value: elem.value
                    });
                })
            );
        })
    );
}
