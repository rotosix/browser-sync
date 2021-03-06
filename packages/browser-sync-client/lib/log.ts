import { BehaviorSubject } from "rxjs";
import { timer } from "rxjs";
import { Observable } from "rxjs";
import { of } from "rxjs";
import { Nanologger } from "../vendor/logger";
import { filter } from "rxjs/operators";
import { tap } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { switchMap } from "rxjs/operators";
import { Inputs } from "./index";
import { pluck } from "rxjs/operators";

export function initLogger(options: IBrowserSyncOptions) {
    const log = new Nanologger(options.logPrefix || "", {
        colors: { magenta: "#0F2634" }
    });
    return of(log);
}

export enum LogNames {
    Log = "@@Log",
    Info = "@@Log.info",
    Debug = "@@Log.debug"
}

export enum Overlay {
    Info = "@@Overlay.info"
}

export type ConsolePayload = [LogNames, any[]];

export function consoleInfo(...args): [LogNames.Log, ConsolePayload] {
    return [LogNames.Log, [LogNames.Info, args]];
}

export function consoleDebug(...args): [LogNames.Log, ConsolePayload] {
    return [LogNames.Log, [LogNames.Debug, args]];
}

export type OverlayInfoPayload = [string, number];

export function overlayInfo(
    message: string,
    timeout = 2000
): [Overlay.Info, OverlayInfoPayload] {
    return [Overlay.Info, [message, timeout]];
}

export const logHandler$ = new BehaviorSubject({
    [LogNames.Log]: (xs: Observable<[LogNames, any]>, inputs: Inputs) => {
        return xs.pipe(
            /**
             * access injectNotification from the options stream
             */
            withLatestFrom(
                inputs.logInstance$,
                inputs.option$.pipe(pluck("injectNotification"))
            ),
            /**
             * only accept messages if injectNotification !== console
             */
            filter(
                ([, , injectNotification]) => injectNotification === "console"
            ),
            tap(([event, log]) => {
                switch (event[0]) {
                    case LogNames.Info: {
                        return log.info.apply(log, event[1]);
                    }
                    case LogNames.Debug: {
                        return log.debug.apply(log, event[1]);
                    }
                }
            })
        );
    },
    [Overlay.Info]: (xs: Observable<[LogNames, any]>, inputs: Inputs) => {
        return xs.pipe(
            withLatestFrom(
                inputs.option$,
                inputs.notifyElement$,
                inputs.document$
            ),
            /**
             * Reject all notifications if notify: false
             */
            filter(([, options]) => Boolean(options.notify)),
            /**
             * Set the HTML of the notify element
             */
            tap(([event, options, element, document]) => {
                element.innerHTML = event[0];
                element.style.display = "block";
                document.body.appendChild(element);
            }),
            /**
             * Now remove the element after the given timeout
             */
            switchMap(([event, options, element, document]) => {
                return timer(event[1] || 2000).pipe(
                    tap(() => {
                        element.style.display = "none";
                        if (element.parentNode) {
                            document.body.removeChild(element);
                        }
                    })
                );
            })
        );
    }
});
