import { motion } from "framer-motion";
import { FC, useRef, ReactNode, MouseEvent } from "react";

// Type Definitions
interface ModelProps {
    children: ReactNode;
    setShowModel?: (show: boolean) => void;
}

// Model Component

/*  A modal component that displays its children in a centered overlay.
    It includes a backdrop that closes the modal when clicked outside the content area.
    Props:
    - isOpen: A boolean indicating whether the modal is open.
    - onClose: A function to call when the modal should be closed.
    - children: The content to display inside the modal.
    */

export const Model: FC<ModelProps> = ({ children, setShowModel }) => {
    const backdropRef = useRef<HTMLDivElement>(null);

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target === backdropRef.current && setShowModel) {
            setShowModel(false);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            ref={backdropRef}
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};
export default Model;