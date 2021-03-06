import { Inputs } from "../index";
import { pluck } from "rxjs/operators";
import { filter } from "rxjs/operators";
import { map } from "rxjs/operators";
import { Observable } from "rxjs";
import { withLatestFrom } from "rxjs/operators";
import { browserSetLocation } from "../effects/browser-set-location.effect";

export interface IncomingPayload {
    url?: string;
    path?: number;
}

export function incomingBrowserLocation(
    xs: Observable<IncomingPayload>,
    inputs: Inputs
) {
    return xs.pipe(
        withLatestFrom(inputs.option$.pipe(pluck("ghostMode", "location"))),
        filter(([, canSyncLocation]) => canSyncLocation === true),
        map(([event]) => browserSetLocation(event))
    );
}
