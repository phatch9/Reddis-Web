import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

// Type definitions
interface PostInfo {
    id: string; // Used in handleDelete and handleSaved
    title?: string;
    [key: string]: any;
}

interface ThreadInfo {
    thread_id: string;
    [key: string]: any;
}

interface CreatorInfo {
    user_name: string;
    [key: string]: any;
}

interface AuthUser {
    username: string;
    roles: ("user" | "mod" | "admin")[];
    mod_in: string[];
    [key: string]: any;
}

// Props for PostOption
interface PostOptionProps {
    creatorInfo: CreatorInfo;
    threadInfo: ThreadInfo;
    currentUser: {
        saved: boolean;
        [key: string]: any;
    };
    postInfo: PostInfo;
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
    setModalData: React.Dispatch<React.SetStateAction<React.ReactNode>>;
    handleShare: () => Promise<void>;
}

// AuthContext Interface (Must remain a functional stub for single-file mandate)
interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser;
}
const AuthConsumer = (): AuthContextType => ({
    isAuthenticated: true,
    user: {
        username: "currentUser",
        roles: ["user", "mod"],
        mod_in: ["test-thread-id"]
    }
});

// Custom hook definition (Must remain defined for single-file mandate)
const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

// Utility component definition (Must remain defined for single-file mandate)
const Svg: React.FC<{ type: 'more', className: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="19" r="2" />
    </svg>
);

// Component definition (Must remain defined for single-file mandate)
const NewPost: React.FC<Pick<PostOptionProps, 'postInfo' | 'threadInfo' | 'setShowModal'> & { isEdit: boolean }> = () =>
    <div className="p-4 bg-gray-100 rounded-lg">New/Edit Post Form</div>;

// COMPLIANT UI COMPONENTS

const DeleteConfirmation: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
    postTitle: string | undefined;
}> = ({ onConfirm, onCancel, postTitle }) => (
    <div className="p-6 space-y-5 bg-white rounded-xl shadow-2xl min-w-[300px]">
        <h2 className="text-xl font-bold text-red-600">Confirm Deletion</h2>
        <p className="text-gray-700">
            Are you sure you want to permanently delete the post:
            <span className="font-semibold italic block mt-1">"{postTitle || 'This Post'}"</span>?
        </p>
        <div className="flex justify-end space-x-3">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium">
                Delete
            </button>
        </div>
    </div>
);

const AuthRequiredMessage: React.FC<{ setShowModal: React.Dispatch<React.SetStateAction<boolean>>, navigate: (path: string) => void }> = ({ setShowModal, navigate }) => (
    <div className="p-6 space-y-5 text-center bg-white rounded-xl shadow-2xl min-w-[300px]">
        <h2 className="text-xl font-bold text-theme-orange">Login Required</h2>
        <p className="text-gray-700">
            You must be logged in to perform this action (Save/Edit/Delete).
        </p>
        <div className="flex justify-center space-x-3">
            <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium">
                Close
            </button>
            <button
                onClick={() => { setShowModal(false); navigate("/login"); }}
                className="px-4 py-2 text-white bg-theme-orange rounded-lg hover:bg-orange-700 transition-colors font-medium">
                Go to Login
            </button>
        </div>
    </div>
);

export default function PostOption({
    creatorInfo,
    threadInfo,
    currentUser,
    postInfo,
    setShowModal,
    setModalData,
    handleShare,
}: PostOptionProps) {
    const { isAuthenticated, user } = AuthConsumer();
    // Initialize postSaved state safely, defaulting to false if currentUser or saved is undefined/null
    const [postSaved, setPostSaved] = useState(currentUser?.saved ?? false);
    const queryClient = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();
    const myRef = useRef<HTMLDivElement>(null);
    const [expand, setExpand] = useState(false);

    // Close dropdown when clicking outside
    const closeDropdown = useCallback(() => setExpand(false), []);
    useClickOutside(myRef, closeDropdown);

    // Function to show a generic login required message in the modal
    const showLoginRequired = useCallback(() => {
        setShowModal(true);
        setModalData(<AuthRequiredMessage setShowModal={setShowModal} navigate={navigate} />);
        setExpand(false);
    }, [setShowModal, setModalData, navigate]);

    // Actual delete logic
    const handleConfirmedDelete = useCallback(async () => {
        setShowModal(false); // Close modal before API call
        try {
            await axios.delete(`/api/post/${postInfo?.id}`);
            console.log(`Post ${postInfo?.id} deleted.`);
            if (location.pathname.includes("post")) {
                // If on the single post page, navigate back
                return navigate(-1);
            }
            // Otherwise, invalidate posts to refresh the list view
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        } catch (error) {
            console.error("Failed to delete post:", error);
            // Optionally show error message in a modal
        }
    }, [postInfo, location.pathname, navigate, queryClient, setShowModal]);

    // Delete handler confirmation setup
    const confirmDelete = useCallback(() => {
        setShowModal(true);
        setModalData(
            <DeleteConfirmation
                onCancel={() => setShowModal(false)}
                onConfirm={handleConfirmedDelete}
                postTitle={postInfo.title}
            />
        );
        setExpand(false);
    }, [setShowModal, setModalData, postInfo, handleConfirmedDelete]);

    const handleSaved = useCallback(async () => {
        if (!isAuthenticated) {
            return showLoginRequired();
        }

        try {
            if (postSaved) {
                await axios.delete(`/api/posts/saved/${postInfo?.id}`);
                setPostSaved(false);
            } else {
                await axios.put(`/api/posts/saved/${postInfo?.id}`);
                setPostSaved(true);
            }
            // Invalidate saved query to refresh user's saved list
            queryClient.invalidateQueries({ queryKey: ["saved"] });
        } catch (error) {
            console.error("Failed to update saved status:", error);
        } finally {
            setExpand(false);
        }
    }, [isAuthenticated, postSaved, postInfo?.id, queryClient, showLoginRequired]);

    const handleEdit = useCallback(() => {
        if (!isAuthenticated || creatorInfo?.user_name !== user.username) {
            return showLoginRequired();
        }

        setShowModal(true);
        setModalData(<NewPost isEdit={true} postInfo={postInfo} setShowModal={setShowModal} threadInfo={threadInfo} />);
        setExpand(false);
    }, [isAuthenticated, creatorInfo, user.username, setShowModal, setModalData, postInfo, threadInfo, showLoginRequired]);

    // Memoize the delete permission check
    const shouldBeAbleToDelete = useMemo(() => {
        if (!isAuthenticated || !creatorInfo) return false;

        const isCreator = creatorInfo.user_name === user.username;
        const isAdmin = user.roles.includes("admin");
        const isMod = user.roles.includes("mod") && user.mod_in.includes(threadInfo.thread_id);

        return isCreator || isAdmin || isMod;
    }, [isAuthenticated, creatorInfo, user.username, user.roles, user.mod_in, threadInfo.thread_id]);

    return (
        <>
            <div
                ref={myRef}
                className="relative flex items-center p-1 md:cursor-pointer group select-none"
                onClick={() => setExpand(true)}
            >
                <Svg className="w-4 h-4 md:w-6 md:h-6 text-gray-500 group-hover:text-theme-orange transition-colors" type="more" />
                <p className="ml-2 text-sm text-gray-700 md:cursor-pointer md:text-base">More</p>

                {expand && (
                    <ul className="absolute top-full right-0 z-20 p-2 mt-2 space-y-1 w-32 list-none bg-white rounded-lg shadow-xl border border-gray-200 transform translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0">
                        {/* Save / Unsave */}
                        <li
                            className="p-1 text-sm text-gray-700 rounded cursor-pointer md:text-base hover:bg-gray-100 transition-colors"
                            onClick={handleSaved}
                        >
                            {postSaved ? "Unsave" : "Save"}
                        </li>

                        {/* Share (visible on desktop only in this specific implementation) */}
                        <li
                            className="p-1 text-sm text-gray-700 rounded cursor-pointer md:text-base hover:bg-gray-100 transition-colors hidden md:block"
                            onClick={() => {
                                // Close dropdown after starting share process
                                handleShare().then(closeDropdown);
                            }}
                        >
                            Share
                        </li>

                        {/* Edit (only for post creator) */}
                        {isAuthenticated && creatorInfo?.user_name === user.username && (
                            <li
                                onClick={handleEdit}
                                className="p-1 text-sm text-gray-700 rounded cursor-pointer md:text-base hover:bg-gray-100 transition-colors">
                                Edit
                            </li>
                        )}

                        {/* Delete (for creator, mod, or admin) */}
                        {shouldBeAbleToDelete && (
                            <li
                                className="p-1 text-sm text-red-600 rounded cursor-pointer md:text-base hover:bg-red-50 transition-colors font-medium"
                                onClick={confirmDelete}>
                                Delete
                            </li>
                        )}
                        
                    </ul>
                )}
            </div>
        </>
    );
}