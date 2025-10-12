
import {useEffect, useRef} from "react";

export default function useEventListener(eventType, callback, element = window) {
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
    
    useEffect(() => {
        if (element == null) return;
        const handler = (event) => callbackRef.current(event);
        element.addEventListener(eventType, handler);
        
        return () => element.removeEventListener(eventType, handler);
    },
    [eventType, element] // Re-run if eventType or element changes
    )
}
