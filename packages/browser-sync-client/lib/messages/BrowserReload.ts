import { Inputs } from "../index";
import { filter } from "rxjs/operators";
import { Observable } from "rxjs";
import { withLatestFrom } from "rxjs/operators";
import { mergeMap } from "rxjs/operators";
import { concat } from "rxjs";
import { of } from "rxjs";
import {
    browserReload,
    preBrowserReload
} from "../effects/browser-reload.effect";
import { subscribeOn } from "rxjs/operators";
import { asyncScheduler } from "rxjs";

export function incomingBrowserReload(xs: Observable<any>, inputs: Inputs) {
    return xs.pipe(
        withLatestFrom(inputs.option$),
        filter(([event, options]) => options.codeSync),
        mergeMap(reloadBrowserSafe)
    );
}

export function reloadBrowserSafe() {
    return concat(
        /**
         * Emit a warning message allowing others to do some work
         */
        of(preBrowserReload()),
        /**
         * On the next tick, perform the reload
         */
        of(browserReload()).pipe(subscribeOn(asyncScheduler))
    );
}
