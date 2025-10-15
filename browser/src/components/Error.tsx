import Loader from "./Loader";
import { FC, ReactNode } from "react";

/**
 * Props for the Error component.
 * Note: Assuming LoaderProps is defined in Loader.tsx
 */
interface ErrorProps {
    /** The error message to display. Defaults to "Something went wrong". */
    message?: string;
    /** If true, the error container will take up the full screen (w-screen h-screen). */
    fullScreen?: boolean;
    /** Optional child elements to render below the loader, if needed. */
    children?: ReactNode;
}

/**
 * A simple component to display error messages, optionally with a full-screen layout 
 * and using the shared Loader component for visual consistency.
 * * @param {ErrorProps} props The component props.
 */
const Error: FC<ErrorProps> = ({
    message = "Something went wrong",
    fullScreen = true
}) => {
    return (
        <div
            className={`flex flex-col justify-center items-center space-y-10 ${
                fullScreen ? "w-screen h-screen" : "w-full h-full"
            } bg-theme-cultured`}>
            {/* The Loader component is expected to receive `forPosts` 
                which corresponds to the `fullScreen` prop's logic here. 
            */}
            <Loader forPosts={fullScreen}>
                <h1 className="text-2xl font-bold">{message}</h1>
            </Loader>
        </div>
    );
}

export default Error;
