import { Inputs } from "../index";
import { filter } from "rxjs/operators";
import { EMPTY } from "rxjs";
import { isBlacklisted } from "../utils";
import { FileReloadEventPayload } from "../../types/socket";
import { of } from "rxjs";
import { Observable } from "rxjs";
import { withLatestFrom } from "rxjs/operators";
import { mergeMap } from "rxjs/operators";
import { fileReload } from "../effects/file-reload.effect";
import { reloadBrowserSafe } from "./BrowserReload";

export function incomingFileReload(
    xs: Observable<FileReloadEventPayload>,
    inputs: Inputs
) {
    return xs.pipe(
        withLatestFrom(inputs.option$),
        filter(([event, options]) => options.codeSync),
        mergeMap(([event, options]) => {
            if (event.url || !options.injectChanges) {
                return reloadBrowserSafe();
            }
            if (event.basename && event.ext && isBlacklisted(event)) {
                return EMPTY;
            }
            return of(fileReload(event));
        })
    );
}
