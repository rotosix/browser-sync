import { IncomingPayload } from "../messages/ScrollEvent";
import { Inputs } from "../index";
import { pluck } from "rxjs/operators";
import { Observable } from "rxjs";
import { ignoreElements } from "rxjs/operators";
import { partition } from "rxjs/operators";
import { merge } from "rxjs";
import { getDocumentScrollSpace } from "../browser.utils";
import { tap } from "rxjs/operators";
import { withLatestFrom } from "rxjs/operators";
import { map } from "rxjs/operators";

type Tuple = [IncomingPayload, Window, Document, boolean];

export function setScrollEffect(
    xs: Observable<IncomingPayload>,
    inputs: Inputs
) {
    {
      /**
         * Group the incoming event with window, document & scrollProportionally argument
         */
        // FIXME: TS2322: Type 'Observable<boolean>' is not assignable to type 'Observable<Tuple>'.
        //  Type 'boolean' is not assignable to type 'Tuple'.
        // @ts-ignore
        const tupleStream$: Observable<Tuple> = xs.pipe(
            withLatestFrom<IncomingPayload, Window,
              // FIXME: TS2344: Type 'Document' does not satisfy the constraint 'ObservableInput<any>'.
              //  Property '[Symbol.iterator]' is missing in type 'Document' but required in type 'Iterable<any>'.
              // @ts-ignore
              Document, boolean>(
                inputs.window$,
                inputs.document$,
                inputs.option$.pipe(pluck("scrollProportionally"))
            )
        );

        /**
         * Split the stream between document scrolls and element scrolls
         */
        const [document$, element$] = partition(([event]: Tuple) => {
            return event.tagName === "document";
        })(tupleStream$);

        /**
         * Further split the element scroll between those matching in `scrollElementMapping`
         * and regular element scrolls
         */
        const [mapped$, nonMapped$] = partition(([event]: Tuple) => {
            return event.mappingIndex > -1;
        })(element$);

        return merge(
            /**
             * Main window scroll
             */
            document$.pipe(
                tap((incoming: Tuple) => {
                    const [
                        event,
                        window,
                        document,
                        scrollProportionally
                    ] = incoming;
                    const scrollSpace = getDocumentScrollSpace(document);

                    if (scrollProportionally) {
                        return window.scrollTo(
                            0,
                            scrollSpace.y * event.position.proportional
                        ); // % of y axis of scroll to px
                    }
                    return window.scrollTo(0, event.position.raw.y);
                })
            ),
            /**
             * Regular, non-mapped Element scrolls
             */
            nonMapped$.pipe(
                tap((incoming: Tuple) => {
                    const [
                        event,
                        window,
                        document,
                        scrollProportionally
                    ] = incoming;

                    const matchingElements = document.getElementsByTagName(
                        event.tagName
                    );
                    if (matchingElements && matchingElements.length) {
                        const match = matchingElements[event.index];
                        if (match) {
                            return scrollElement(
                                match,
                                scrollProportionally,
                                event
                            );
                        }
                    }
                })
            ),
            /**
             * Element scrolls given in 'scrollElementMapping'
             */
            mapped$.pipe(
                withLatestFrom(
                    inputs.option$.pipe(pluck("scrollElementMapping"))
                ),
                /**
                 * Filter the elements in the option `scrollElementMapping` so
                 * that it does not contain the element that triggered the event
                 */
                map(([incoming, scrollElementMapping]: [Tuple, string[]]) => {
                    const [event] = incoming;
                    return [
                        incoming,
                        scrollElementMapping.filter(
                            (item, index) => index !== event.mappingIndex
                        )
                    ];
                }),
                /**
                 * Now perform the scroll on all other matching elements
                 */
                tap(([incoming, scrollElementMapping]: [Tuple, string[]]) => {
                    const [
                        event,
                        window,
                        document,
                        scrollProportionally
                    ] = incoming;
                    scrollElementMapping
                        .map(selector => document.querySelector(selector))
                        .forEach(element => {
                            scrollElement(element, scrollProportionally, event);
                        });
                })
            )
        ).pipe(ignoreElements());
    }
}

function scrollElement(element, scrollProportionally, event: IncomingPayload) {
    if (scrollProportionally && element.scrollTo) {
        return element.scrollTo(
            0,
            element.scrollHeight * event.position.proportional
        ); // % of y axis of scroll to px
    }
    return element.scrollTo(0, event.position.raw.y);
}
