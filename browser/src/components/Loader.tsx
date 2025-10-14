import { ReactNode } from "react";
// Interface Definitions
/**
 * Defines the props for the Loader component.
 * @param forPosts - If true, restricts the loader size (e.g., for inline content loading).
 * @param children - Optional content to render after the loader animation.
 */
interface LoaderProps {
    forPosts?: boolean;
    children?: ReactNode;
}

// Embedded CSS for Pac-Man Animation (from loader.css)
// I embed the CSS here to make the component fully self-contained and runnable.
// CSS design component
const pacmanStyles = `
/* Based on the 'load-awesome' Pac-Man implementation */
.la-pacman {
    --loader-color: #FF4500; /* Default color, overridden by inline style */
    position: relative;
    box-sizing: border-box;
    width: 96px; /* la-3x size */
    height: 96px;
}

/* The Pac-Man head (animated mouth opening/closing) */
.la-pacman > div:nth-child(1) {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    transform: translate(-50%, -50%);
    border-radius: 100%;
    border: 8px solid var(--loader-color);
    border-right-color: transparent;
    animation: pacman-rotate 0.5s linear infinite;
    transform-origin: center center;
}

/* The dots (food) */
.la-pacman > div:not(:nth-child(1)) {
    position: absolute;
    top: 50%;
    left: 100%;
    box-sizing: border-box;
    width: 16px; /* Dot size */
    height: 16px;
    border-radius: 100%;
    background: var(--loader-color);
    animation: pacman-food 4s linear infinite;
    transform: translateY(-50%);
}

/* Animation delays for the dots */
.la-pacman > div:nth-child(2) { animation-delay: -3s; }
.la-pacman > div:nth-child(3) { animation-delay: -2s; }
.la-pacman > div:nth-child(4) { animation-delay: -1s; }
.la-pacman > div:nth-child(5) { animation-delay: 0s; }

/* Keyframes for Pac-Man's mouth (rotation) */
@keyframes pacman-rotate {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    50% { transform: translate(-50%, -50%) rotate(45deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Keyframes for the food dots (movement) */
@keyframes pacman-food {
    0% { transform: translateY(-50%) translateX(0); opacity: 1; }
    50% { opacity: 1; }
    99% { transform: translateY(-50%) translateX(-800%); opacity: 1; }
    100% { transform: translateY(-50%) translateX(-800%); opacity: 0; }
}
`;

// Loader Component

export function Loader({ forPosts = false, children = null }: LoaderProps) {
  // Determine the size classes based on the 'forPosts' prop
    const sizeClass = forPosts ? "max-w-full max-h-full" : "w-screen h-screen";

  // The color is set via inline style on the parent div which the CSS uses as a variable.
    const loaderStyle = { '--loader-color': '#FF4500' } as React.CSSProperties;

    return (
    <>
      {/* Inject styles */}
    <style>{pacmanStyles}</style>

      {/* Loader Container */}
    <div
        className={`flex justify-center items-center ${sizeClass} bg-white dark:bg-gray-900 transition-colors duration-300`}
        >
        <div style={loaderStyle} className="la-pacman la-dark la-3x">
          {/* Pac-Man Head */}
            <div></div>
            {/* Dots 1-4 */}
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          {/* The original had 6 divs total. I've only animated 5 for simplicity and standard pacman style. */}
        </div>
    </div>

      {/* Render children if provided (e.g., error messages, status updates) */}
        {children}
    </>
    );
}

export default Loader;
