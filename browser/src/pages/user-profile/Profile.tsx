import React, { useEffect, useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "react-router-dom";

// Types and Interfaces
// Data Interfaces
interface Karma {
    user_karma: number;
    posts_count: number;
    posts_karma: number;
    comments_count: number;
    comments_karma: number;
}

interface UserProfileData {
    username: string;
    avatar: string | null; // avatar is optional or null on the backend
    bio: string | null; // bio is optional or null
    registrationDate: string; // ISO date string
    karma: Karma;
}

interface AuthUser {
    username: string;
    // Assume user object also contains other necessary auth info
}

// Action State Type
// 'delete_confirm' is added as an internal state to trigger the confirmation modal
type ActionKey = false | "message" | "edit" | "delete";
type ActionState = ActionKey | "delete_confirm" | React.ReactNode;

// Mock Implementations
// For a single-file environment, we must mock dependencies like useQuery, useParams, etc.
// Mock Assets
const avatar = "https://placehold.co/150x150/f0f0f0/333333?text=Avatar";

// Mock AuthConsumer
interface AuthContextType {
    logout: () => Promise<void>;
    user: AuthUser;
}
const AuthConsumer = (): AuthContextType => ({
    logout: async () => { console.log("Mock Logout called."); },
    user: { username: "currentUser" } // Mock the current logged-in user
});

// Mock Hooks
const useParams = () => ({ username: "testuser" });
const useNavigate = () => (path: string) => console.log(`Navigating to: ${path}`);
const axios = {
    get: (url: string) => {
        console.log(`Mock axios GET: ${url}`);
        // Simulate data fetching
        const mockData: UserProfileData = {
            username: "testuser",
            avatar: null,
            bio: "I post funny things and enjoy good conversation.",
            registrationDate: new Date(Date.now() - 86400000 * 365 * 2).toISOString(), // 2 years ago
            karma: {
                user_karma: 1200,
                posts_count: 50,
                posts_karma: 800,
                comments_count: 150,
                comments_karma: 400,
            }
        };
        return Promise.resolve({ data: mockData });
    },
    delete: (url: string) => {
        console.log(`Mock axios DELETE: ${url}`);
        return Promise.resolve();
    }
};

// Mock useQuery
interface QueryResult<TData> {
    data: TData | undefined;
    isFetching: boolean;
}

function useQuery<TData>(options: {
    queryKey: (string | undefined)[];
    queryFn: () => Promise<{ data: TData }>;
    enabled?: boolean;
}): QueryResult<TData> {
    const [data, setData] = useState<TData | undefined>(undefined);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        if (options.enabled === false) return;
        setIsFetching(true);
        options.queryFn().then(res => {
            setData(res.data);
            setIsFetching(false);
        }).catch(err => {
            console.error("Mock Query Error:", err);
            setIsFetching(false);
        });
    }, options.queryKey); // Simplified dependency handling

    return { data, isFetching };
}

// Mock Components added
const Loader: React.FC<{ forPosts: boolean }> = () => <div className="animate-spin text-xl text-theme-orange mx-auto">Loading Profile...</div>;
const InfinitePostsLayout: React.FC<{ apiQueryKey: string | undefined, linkUrl: string, enabled: boolean }> = ({ apiQueryKey, linkUrl, enabled }) => (
    <div className="w-full max-w-2xl mt-4 p-4 bg-white rounded-xl shadow-lg text-center">
        {enabled ? (
            <p className="text-gray-600">Posts for {apiQueryKey} loaded here from: {linkUrl}</p>
        ) : (
            <p className="text-gray-400">Loading post layout...</p>
        )}
    </div>
);
const Modal: React.FC<React.PropsWithChildren<{ showModal: ActionState, setShowModal: React.Dispatch<React.SetStateAction<ActionState>> }>> = ({ children, setShowModal }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={() => setShowModal(false)}
    >
        <div className="bg-white p-6 rounded-lg shadow-2xl max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </motion.div>
);

// Mock component definitions
const Chat: React.FC<{ sender: UserProfileData | undefined, setCurChat: React.Dispatch<React.SetStateAction<ActionState>>, newChat: boolean }> = ({ sender }) => 
    <div className="p-4">Chat window with {sender?.username || 'user'}</div>;
const UpdateUser: React.FC<{ setModal: React.Dispatch<React.SetStateAction<ActionState>> }> = ({ setModal }) => 
    <div className="p-4 bg-gray-100 rounded-lg">Update User Form <button className="ml-2 text-sm text-blue-500" onClick={() => setModal(false)}>Close</button></div>;

// Profile Component

export function Profile() {
    // Hooks Typing
    const { logout, user } = AuthConsumer();
    const { username } = useParams<{ username: string }>();

    // State Typing
    const [action, setAction] = useState<ActionState>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

    // useQuery Typing: TData is UserProfileData
    const { data, isFetching: userIsFetching } = useQuery<UserProfileData>({
        queryKey: ["user", username],
        queryFn: async () => {
            return await axios.get(`/api/user/${username}`).then((res) => res.data);
        },
    });

    // Refactored Logic for Handling Actions
    useEffect(() => {
        // Only run logic if action is a string key
        if (typeof action === 'string') {
            switch (action) {
                case "message":
                    // Set action to the React element (the Chat component)
                    setAction(<Chat sender={data} setCurChat={setAction} newChat={true} />);
                    break;
                case "edit":
                    // Set action to the React element (the UpdateUser component)
                    setAction(<UpdateUser setModal={setAction} />);
                    break;
                case "delete":
                    // Instead of window.confirm, trigger the confirmation modal
                    setShowDeleteConfirm(true);
                    setAction(false); // Reset dropdown action
                    break;
                default:
                    setAction(false);
                    break;
            }
        }
    }, [action, data, username]); // Removed logout from deps as it's stable and only used in the delete confirmation

    // Handle Title Change
    useEffect(() => { 
        document.title = "u/" + username; 
        return () => { document.title = "Threaddit" } 
    }, [username]);


    // Delete Confirmation Handler (runs only on confirmation)
    const handleAccountDelete = useCallback(() => {
        setShowDeleteConfirm(false); // Close confirmation modal
        axios.delete(`/api/user`).then(() => {
            console.log("Account deleted successfully.");
            logout(); // Log out after successful deletion
        }).catch(err => {
            console.error("Deletion failed:", err);
            // Handle deletion error (e.g., show a toast/message)
        });
    }, [logout]);

    // Modal Content for the main action state
    