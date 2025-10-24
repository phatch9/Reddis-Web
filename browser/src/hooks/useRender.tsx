import { useEffect, useRef } from "react";
/**
 * Custom React hook that returns true only during the initial (first) render
 * of the component. After the first render completes, it always returns false.
 *
 * This is useful for running logic only on the very first mount, but using
 * the return value *during* the render cycle.
 * * @returns {boolean} True if the component is currently in its first render cycle, false otherwise.
 */
export function useFirstRender(): boolean {
  // Use a ref to persist the mutable value across renders
    const firstRender = useRef(true);

  // useEffect runs *after* the render is committed to the screen.
  // The empty dependency array ensures this runs only once on mount.
    useEffect(() => {
    firstRender.current = false;
    }, []);
    return firstRender.current;
}

export default useFirstRender;
