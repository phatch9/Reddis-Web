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

// Mock component added 