import { Inputs } from "../index";
import { Observable } from "rxjs";
import * as KeyupEvent from "../messages/KeyupEvent";
import { tap } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { EffectNames } from "../effects";

export function setElementValueEffect(
    xs: Observable<KeyupEvent.IncomingPayload>,
    inputs: Inputs
) {
    return xs.pipe(
        withLatestFrom(inputs.window$, inputs.document$),
        tap(([event, window, document]) => {
            const elems = document.getElementsByTagName(event.tagName);
            const match = elems[event.index];
            if (match) {
                // (match as HTMLInputElement).value = event.value;
                const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
                setValue.call(match, event.value);

                if (document.createEvent) {
                    window.setTimeout(function() {
                        const evObj = new InputEvent("input", {
                          inputType: "insertText",
                          data: event.value,
                          isComposing: false
                        });
                        evObj.initEvent('input', true, false);
                        match.dispatchEvent(evObj);
                    }, 0);
                } else {
                  window.setTimeout(function() {
                      if ((document as any).createEventObject) {
                          const evObj = (document as any).createEventObject();
                          evObj.type = "oninput";
                          (match as any).fireEvent("on" + "input", evObj);
                      }
                    }, 0);
                }
            }
        })
    );
}

export function setElementValue(event: KeyupEvent.IncomingPayload) {
    return [EffectNames.SetElementValue, event];
}
