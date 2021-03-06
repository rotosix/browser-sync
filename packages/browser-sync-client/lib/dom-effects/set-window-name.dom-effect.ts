import { Inputs } from "../index";
import { ignoreElements } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { Events } from "../dom-effects";

export function setWindowNameDomEffect(xs: Observable<string>, inputs: Inputs) {
    return xs.pipe(
        withLatestFrom(inputs.window$),
        tap(([value, window]) => (window.name = value)),
        ignoreElements()
    );
}

export function setWindowName(
    incoming: string
): [Events.SetWindowName, string] {
    return [Events.SetWindowName, incoming];
}
