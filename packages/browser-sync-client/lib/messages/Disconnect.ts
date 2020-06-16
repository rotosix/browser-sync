import { ignoreElements } from "rxjs/operators";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export function incomingDisconnect(xs: Observable<any>) {
    return xs.pipe(tap(x => console.log(x)), ignoreElements());
}
