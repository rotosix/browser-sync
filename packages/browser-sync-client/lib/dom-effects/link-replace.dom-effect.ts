import { map } from "rxjs/operators";
import { Inputs } from "../index";
import { filter } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { Observable } from "rxjs";
import * as Log from "../log";
import { pluck } from "rxjs/operators";
import { Events } from "../dom-effects";

export type LinkReplacePayload = {
    target: HTMLLinkElement;
    nextHref: string;
    prevHref: string;
    pathname: string;
    basename: string;
};

export function linkReplaceDomEffect(
    xs: Observable<LinkReplacePayload>,
    inputs: Inputs
) {
    return xs.pipe(
        withLatestFrom<LinkReplacePayload, any>(
            inputs.option$.pipe(pluck("injectNotification"))
        ),
        filter(([, inject]) => !!inject),
        map(([incoming, inject]) => {
            const message = `[LinkReplace] ${incoming.basename}`;
            if (inject === "overlay") {
                return Log.overlayInfo(message);
            }
            return Log.consoleInfo(message);
        })
    );
}

export function linkReplace(
    incoming: LinkReplacePayload
): [Events.LinkReplace, LinkReplacePayload] {
    return [Events.LinkReplace, incoming];
}
