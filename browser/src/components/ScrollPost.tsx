import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useInfiniteQuery } from "@tanstack/react-query";

// These mocks make the component runnable without external libraries/files.
// Mock for 'axios'
const axios = {
    get: async (url: string) => {
        console.log(`Mock Fetching: ${url}`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const params = new URLSearchParams(url.split('?')[1]);
        const offset = parseInt(params.get('offset') || '0') || 0;
        const limit = parseInt(params.get('limit') || '20') || 20;

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
    
    const setSearchParams = useCallback((newParams: any, options: any) => {
        setParams(prev => ({ ...prev, ...Object.fromEntries(newParams.entries()) }));
        console.log("Search Params Updated:", Object.fromEntries(newParams.entries()));
    }, []);

    // Helper to simulate the URLSearchParams object
    const MockURLSearchParams = useMemo(() => {
        const urlParams = new Map(Object.entries(params));
        return {
            get: (key: string) => urlParams.get(key),
            set: (key: string, value: string) => { urlParams.set(key, value); return urlParams; },
            entries: () => urlParams.entries(),
        };
    }, [params]);

    return [MockURLSearchParams, setSearchParams];
};

// Mock for 'framer-motion'
const motion = {
    div: ({ children, className, initial, animate, transition }: any) => <div className={className}>{children}</div>,
    li: ({ children, className, variants, initial, animate, exit, transition }: any) => <li className={className}>{children}</li>,
};
const AnimatePresence = ({ children }: any) => <>{children}</>;

// Mock for 'Loader'
const Loader = ({ forPosts }: any) => (
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
const Post = ({ post, postIndex }: any) => (
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

// INFINITE POSTS LAYOUT COMPONENT

export function InfinitePostsLayout({ linkUrl, apiQueryKey, forSaved = false, enabled = true }: any) {
    const [searchParams, setSearchParams] = useSearchParamsMock() as any;
    const sortBy = (searchParams as any).get("sortBy") || "top";
    const duration = (searchParams as any).get("duration") || "alltime";

    // Use useInfiniteQuery from TanStack Query
    const { data, isFetching, hasNextPage, fetchNextPage, refetch } = useInfiniteQuery({
        queryKey: ["posts", apiQueryKey, sortBy, duration],
        queryFn: async ({ pageParam = 0 }) => {
            // Mock API call using stubbed axios
            return await axios
                .get(`/api/${linkUrl}?limit=${20}&offset=${pageParam * 20}&sortby=${sortBy}&duration=${duration}`)
                .then((data) => data.data);
        },
        enabled: enabled,
        // Calculate the next page parameter
        getNextPageParam: (lastPage, pages) => {
            if (lastPage.length < 20) return undefined;
            return pages.length;
        },
        // Refetch whenever sortBy or duration changes
        initialPageParam: 0,
    });
    
    // Trigger refetch when filters change to start over at page 0
    useEffect(() => {
        refetch();
    }, [sortBy, duration, refetch]);

    // Infinite Scrolling Logic
    useEffect(() => {
        const onScroll = () => {
            // We use document.documentElement for general window scrolling
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            
            // Trigger fetch when user is close to the bottom (within 2 viewports)
            if (scrollHeight - scrollTop <= clientHeight * 2 && hasNextPage && !isFetching) {
                console.log("Fetching next page...");
                fetchNextPage();
            }
        };
        
        // Attach event listener
        window.addEventListener("scroll", onScroll);
        
        // Cleanup listener on unmount
        return () => {
            window.removeEventListener("scroll", onScroll);
        };
    }, [fetchNextPage, isFetching, hasNextPage]);

// Handler for Duration filter change
    function handleDurationChange(newDuration: any) {
        // Create a new mutable URLSearchParams mock object
        const newParams = { entries: () => [["duration", newDuration]] };
        (setSearchParams as any)(newParams, { replace: true });
    }

    // Handler for SortBy filter change
    function handleSortByChange(newSortBy: any) {
        // Create a new mutable URLSearchParams mock object
        const newParams = { entries: () => [["sortBy", newSortBy]] };
        (setSearchParams as any)(newParams, { replace: true });
    }

    // Determine if we have loaded data yet
    const isLoadingInitial = isFetching && data?.pages.length === 0;

    return (
        <div
            id="main-content"
            className="flex w-full flex-col flex-1 p-2 space-y-4 rounded-lg bg-gray-50 md:bg-white md:m-3 max-w-2xl mx-auto">
            
            {/* Filtering Header */}
            {!forSaved && (
                <header className="flex justify-between items-center p-3 bg-white rounded-xl shadow-md border border-gray-100">
                    
                    {/* Mobile Sorting Controls (Select Boxes) */}
                    <div className="flex space-x-4 md:hidden text-sm">
                        <div className="flex items-center space-x-2">
                            <span>Sort by</span>
                            <select
                                name="sort"
                                id="sort-mobile"
                                className="p-1.5 px-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleSortByChange(e.target.value)}
                                value={sortBy}>
                                <option value="top">Top</option>
                                <option value="hot">Hot</option>
                                <option value="new">New</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span>Of</span>
                            <select
                                name="duration"
                                id="duration-mobile"
                                className="p-1.5 px-3 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => handleDurationChange(e.target.value)}
                                value={duration}>
                                <option value="day">Day</option>
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                                <option value="alltime">All Time</option>
                            </select>
                        </div>
                    </div>

                    {/* Desktop Duration Tabs */}
                    <ul className="hidden space-x-2 list-none md:flex">
                        {['day', 'week', 'month', 'alltime'].map(d => (
                            <li
                                key={d}
                                className={`p-2 rounded-md px-4 text-sm font-medium cursor-pointer transition-colors duration-150 ${duration === d ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-700"
                                }`}
                                onClick={() => handleDurationChange(d)}>
                                {d === 'alltime' ? 'All Time' : d.charAt(0).toUpperCase() + d.slice(1)}
                            </li>
                        ))}
                    </ul>

                    {/* Desktop SortBy Tabs */}
                    <ul className="hidden mr-5 space-x-2 list-none md:flex">
                        {['hot', 'new', 'top'].map(s => (
                            <li
                                key={s}
                                className={`p-2 rounded-md px-4 text-sm font-medium cursor-pointer transition-colors duration-150 ${sortBy === s ? "bg-orange-100 text-orange-700" : "hover:bg-gray-100 text-gray-700"
                                }`}
                                onClick={() => handleSortByChange(s)}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </li>
                        ))}
                    </ul>
                </header>
            )}

            {/* Loading Indicator */}
            {isLoadingInitial && <Loader forPosts={true} />}

            {/* No Posts Found Message */}
            {!isLoadingInitial && data?.pages[0]?.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <p className="p-5 bg-white rounded-xl border-2 border-dashed border-gray-300 text-center text-gray-600">
                        No posts with this filter were found. Be the first to add one!
                    </p>
                </motion.div>
            ) : (
                // Posts List
                <div className="flex flex-col space-y-3">
                    {data?.pages.map((pageData, index) => (
                        // Ensure each page has a unique key
                        <ul className="flex flex-col space-y-3" key={index}>
                            <AnimatePresence initial={index === 0}>
                                {pageData?.map((post, postIndex) => (
                                    // Combine page index and post index for a unique key across all pages
                                    <Post post={post} key={post.post_info.id} postIndex={postIndex} />
                                ))}
                            </AnimatePresence>
                        </ul>
                    ))}
                </div>
            )}
            
            {/* Fetching Next Page Indicator */}
            {hasNextPage && isFetching && (
                <div className="py-4 text-center text-blue-500 font-medium">
                    Loading more posts...
                </div>
            )}

            {/* End of Content Indicator */}
            {!hasNextPage && (data?.pages?.[0]?.length ?? 0) > 0 && (
                <div className="py-4 text-center text-gray-400 text-sm">
                    — You've reached the end of the line —
                </div>
            )}
        </div>
    );
}

// --- APP WRAPPER --- Required to provide the QueryClient context.
const queryClient = new QueryClient();

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-gray-100 p-4">
                <h1 className="text-3xl font-extrabold text-center mb-6 text-gray-900">
                    Infinite Posts Feed (Scroll Down!)
                </h1>
                <InfinitePostsLayout 
                    linkUrl="posts" 
                    apiQueryKey="homeFeed"
                    enabled={true} 
                />
            </div>
        </QueryClientProvider>
    );
}