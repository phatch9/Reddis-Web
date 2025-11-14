import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";

// These mocks make the component runnable without external libraries/files.
// Mock for 'axios'
const axios = {
    get: async (url) => {
        console.log(`Mock Fetching: ${url}`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(500));
        
        const params = new URLSearchParams(url.split('?')[1]);
        const offset = parseInt(params.get('offset')) || 0;
        const limit = parseInt(params.get('limit')) || 20;

        // Mock Data Generation
        const totalMockPosts = 65; 
        const posts = [];
        
        // Return max 20 posts per page, stopping after totalMockPosts
        for (let i = 0; i < limit; i++) {
            const postIndex = offset + i;
            if (postIndex >= totalMockPosts) break;
            
            posts.push({
                post_info: { 
                    id: `p${postIndex}`, 
                    title: `Mock Post ${postIndex + 1}: ${params.get('sortby')} / ${params.get('duration')}`,
                    post_karma: Math.floor(Math.random() * 1000)
                },
                user_info: { user_name: 'mockUser' },
                thread_info: { thread_name: 'r/test' },
            });
        }
        
        return { data: posts };
    },
};

// Mock for 'react-router-dom' useSearchParams
const useSearchParamsMock = () => {
    const [params, setParams] = useState({ sortBy: 'top', duration: 'alltime' });
    const searchParams = useMemo(() => ({
        get: (key) => params[key],
    }), [params]);
    
    const setSearchParams = useCallback((newParams, options) => {
        setParams(prev => ({ ...prev, ...Object.fromEntries(newParams.entries()) }));
        console.log("Search Params Updated:", Object.fromEntries(newParams.entries()));
    }, []);

    // Helper to simulate the URLSearchParams object
    const MockURLSearchParams = useMemo(() => {
        const urlParams = new Map(Object.entries(params));
        return {
            get: (key) => urlParams.get(key),
            set: (key, value) => { urlParams.set(key, value); return urlParams; },
            entries: () => urlParams.entries(),
        };
    }, [params]);

    return [MockURLSearchParams, setSearchParams];
};

// Mock for 'framer-motion'
const motion = {
    div: ({ children, className, initial, animate, transition }) => <div className={className}>{children}</div>,
    li: ({ children, className, variants, initial, animate, exit, transition }) => <li className={className}>{children}</li>,
};
const AnimatePresence = ({ children }) => <>{children}</>;

// Mock for 'Loader'
const Loader = ({ forPosts }) => (
    <div className="flex justify-center items-center p-8 text-lg text-gray-500">
        Loading {forPosts ? 'Posts...' : 'Data...'}
    </div>
);

// Mock for PropTypes
// ADDED 'number' and 'any' to the mock to satisfy the Post.propTypes definition below,
// and removed React prefixing from Post.propTypes
const PropTypes = { 
    string: () => null, 
    bool: () => null,
    number: () => null, 
    any: () => null 
};

// Mock for 'Post' component (minimal implementation)
const Post = ({ post, postIndex }) => (
    <motion.li
        className="flex flex-col p-3 bg-white rounded-xl border-2 border-gray-200 shadow-sm transition-shadow duration-300 hover:shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: postIndex * 0.02 }}>
        <h3 className="text-lg font-semibold text-gray-800">{post.post_info.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
            Posted by u/{post.user_info.user_name} in {post.thread_info.thread_name} | Karma: {post.post_info.post_karma}
        </p>
    </motion.li>
);
// FIXED: Changed invalid nested structure (which caused undefined errors) to use the local mock PropTypes correctly.
Post.propTypes = { post: PropTypes.any, postIndex: PropTypes.number };

