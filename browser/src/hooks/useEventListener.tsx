import { useEffect, useRef } from "react";
/**
 * Overload for events on the Window object (default element).
 * Infers the Event type based on the provided eventType key.
 */
export default function useEventListener<K extends keyof WindowEventMap>(
    eventType: K,
    callback: (event: WindowEventMap[K]) => void,
    element?: Window | null
): void;

/**
 * Overload for events on HTML element.
 * Infers the Event type based on the provided eventType key.
 */
export default function useEventListener<
    K extends keyof HTMLElementEventMap,
    T extends HTMLElement
>(
    eventType: K,
    callback: (event: HTMLElementEventMap[K]) => void,
    element: T | null
): void;

/**
 * Overload for custom or untyped events (fall-back).
 */
export default function useEventListener(
    eventType: string,
    callback: EventListener,
    element?: EventTarget | null
): void;

// -- Implementation Signature --

/**
 * Custom hook to attach an event listener to an element (defaults to window).
 * It uses a ref to ensure the callback function is always the latest one,
 * which means the listener itself only needs to be attached once.
 *
 * @param eventType name of the event (e.g., 'click', 'resize').
 * @param callback handler function to be executed when the event fires.
 * @param element target element (defaults to window).
 */
export default function useEventListener(
    eventType: string,
    callback: EventListener,
    element: EventTarget | null = typeof window !== 'undefined' ? window : null // Default to window if available
) {
    // 1. Store the callback in a ref to always get the latest version
    // We use EventListener type from the DOM API as the type for the ref
    const callbackRef = useRef<EventListener>(callback);

    // Update the ref whenever the callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // 2. Attach and clean up the event listener
    useEffect(() => {
        // Guard against SSR and null elements
        if (element == null) return;

        // Create a stable handler function that calls the current callback in the ref
        const handler: EventListener = (event) => {
            callbackRef.current(event);
        };

        // Attach the listener
        element.addEventListener(eventType, handler);

        // Cleanup function to remove the event listener
        return () => {
            element.removeEventListener(eventType, handler);
        };
    },
    // Only re-run if eventType or element object changes
    [eventType, element]
    )
}
