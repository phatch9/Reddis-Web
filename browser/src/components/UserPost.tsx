import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
// EXTERNAL LIBRARY/COMPONENT
// Third-Party Libraries Stubs
const Link = ({ to, children, className, onClick }) => <a href={to} className={className} onClick={onClick}>{children}</a>;
const useNavigate = () => (path) => console.log("Navigate to:", path);
const AnimatePresence = ({ children }) => <>{children}</>;
const motion = { li: ({ children, className, variants, initial, animate, exit, transition }) => <li className={className} children={children} /> };
const useInView = (ref, options) => true; // Mock always in view
const ScrollRestoration = () => null;
const PropTypes = { object: () => null, bool: () => null, number: () => null, func: () => null };
const ReactPlayer = ({ playing, controls, url, width, height, muted, loop, style }) => (
    <div className="bg-black text-white p-4 text-center">Mock Video Player: {url}</div>
);
const Markdown = ({ children, className }) => <div className={className}>{children}</div>;
const avatar = "https://placehold.co/100x100/F97316/ffffff?text=U";

// Local Component Stubs
const Svg = ({ type, className, onClick }) => <span className={`inline-block ${className} text-gray-500`} onClick={onClick}>[{type}]</span>;
const AuthConsumer = () => ({ isAuthenticated: true, user: { username: "mockuser", mod_in: ["r/test-thread-id"], roles: ["user"] } });

const AuthRequiredMessage = ({ setShowModal, navigate }) => (
    <div className="p-6 space-y-5 text-center bg-white rounded-xl shadow-2xl min-w-[300px]">
        <h2 className="text-xl font-bold text-orange-600">Login Required</h2>
        <p className="text-gray-700">You must be logged in to perform this action.</p>
        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-white bg-orange-600 rounded-lg">Close</button>
    </div>
);

const ToastMessage = ({ success, message, setShowModal }) => (
    <div className={`p-4 rounded-lg shadow-xl ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <p className="font-medium">{message}</p>
        <button onClick={() => setShowModal(false)} className="mt-2 text-xs underline">Dismiss</button>
    </div>
);

const Modal = ({ setShowModal, showModal, children }) => {
    if (!showModal) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50 p-4" onClick={() => setShowModal(false)}>
            <div className="relative" onClick={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

const Vote = ({ intitalVote, initialCount, type }) => (
    <div className={`flex items-center ${type === 'full' ? 'flex-col space-y-1' : 'space-x-1'}`}>
        <Svg type="upvote" className="w-5 h-5 text-gray-400 hover:text-green-600" />
        <span className="text-sm font-bold">{initialCount || 0}</span>
        <Svg type="downvote" className="w-5 h-5 text-gray-400 hover:text-red-600" />
    </div>
);

// 3. PostMoreOptions (The component that was throwing the QueryClient error)
// This definition includes the necessary useQueryClient hook but now it is wrapped in the provider via App.
const PostMoreOptions = ({
    creatorInfo,
    threadInfo,
    currentUser,
    postInfo,
    setShowModal,
    setModalData,
    handleShare,
}) => {
    // THIS useQueryClient call caused the original error. It is now fixed by the App component wrapper.
    const queryClient = useQueryClient();
    const { isAuthenticated, user } = AuthConsumer();
    const [expand, setExpand] = useState(false);
    
    const isCreator = creatorInfo?.user_name === user.username;
    const shouldBeAbleToDelete = isCreator || user.roles.includes("mod") && user.mod_in.includes(threadInfo?.thread_id);

    const handleSaved = () => { 
        if (!isAuthenticated) { return setShowModal(true); } 
        setExpand(false);
        console.log("Saving/Unsaving post");
        queryClient.invalidateQueries({ queryKey: ["savedPosts"] }); 
    };
    
    const confirmDelete = () => {
        setExpand(false);
        setShowModal(true);
        setModalData(
            <AuthRequiredMessage setShowModal={setShowModal} navigate={() => {}} />
        );
    };

    return (
        <div className="relative flex items-center p-1 cursor-pointer select-none">
            <Svg className="w-6 h-6 text-gray-500" type="more" onClick={() => setExpand(prev => !prev)} />

            {expand && (
                <ul className="absolute top-full right-0 z-20 p-2 mt-2 space-y-1 w-36 list-none bg-white rounded-lg shadow-xl border border-gray-200">
                    <li className="p-1 text-sm text-gray-700 hover:bg-gray-100" onClick={handleSaved}>{currentUser?.saved ? "Unsave" : "Save"}</li>
                    <li className="p-1 text-sm text-gray-700 hover:bg-gray-100" onClick={() => { handleShare(); setExpand(false); }}>Share</li>
                    {isCreator && <li className="p-1 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setExpand(false)}>Edit</li>}
                    {shouldBeAbleToDelete && <li className="p-1 text-sm text-red-600 hover:bg-red-50" onClick={confirmDelete}>Delete</li>}
                </ul>
            )}
        </div>
    );
};

// Utility for handleShare (replaces navigator.clipboard)
const copyToClipboard = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful;
    } catch (err) {
        document.body.removeChild(textarea);
        return false;
    }
};
