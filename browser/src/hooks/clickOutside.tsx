import { RefObject } from "react";
// Assuming useEventListener is defined in the same directory:
import useEventListener from "./useEventListener";

/** Defines the type for the callback function, which receives the native MouseEvent.
 */
type ClickOutsideCallback = (event: MouseEvent) => void;

/**
 * @template T Must be an element extending HTMLElement (e.g., HTMLDivElement).
 * @param ref - A React RefObject pointing to the target DOM element.
 * @param cb - The callback function to execute when an outside click is detected.
 */
export default function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  cb: ClickOutsideCallback
): void {
  useEventListener(
    "click",
    (e) => {
      // We check for two conditions where we must exit early:

      // 1. If the ref is not yet attached to an element, or the event isn't a click event.
        if (!(e instanceof MouseEvent) || ref.current === null) {
        return;
        }
      // 2. If the click occurred inside the referenced element.
      // We cast e.target to Node for the `contains` method, which expects a Node.
      if (ref.current.contains(e.target as Node)) {
        return;
        }
      // If neither condition is met, the click was outside, so call the callback.
        cb(e);
    },
    // We attach the listener to the global document object.
    document
  );
}
