import { Inputs } from "../index";
import { ignoreElements } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { Events } from "../dom-effects";

export type SetScrollPayload = { x: number; y: number };

export function setScroll(
    x: number,
    y: number
): [Events.SetScroll, SetScrollPayload] {
    return [Events.SetScroll, { x, y }];
}

export function setScrollDomEffect(
    xs: Observable<SetScrollPayload>,
    inputs: Inputs
) {
    return xs.pipe(
        withLatestFrom(inputs.window$),
        tap(([event, window]) => window.scrollTo(event.x, event.y)),
        ignoreElements()
    );
}
