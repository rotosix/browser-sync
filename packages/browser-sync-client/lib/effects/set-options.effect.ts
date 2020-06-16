import { Inputs } from "../index";
import { Observable } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { tap } from "rxjs/operators";
import { EffectNames } from "../effects";

/**
 * Set the local client options
 * @param xs
 * @param inputs
 */
export function setOptionsEffect(
    xs: Observable<IBrowserSyncOptions>,
    inputs: Inputs
) {
    return xs.pipe(
        tap(options => inputs.option$.next(options)),
        // map(() => consoleInfo('set options'))
        ignoreElements()
    );
}

export function setOptions(options: IBrowserSyncOptions) {
    return [EffectNames.SetOptions, options];
}
