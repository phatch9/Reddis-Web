import { useQuery } from "@tanstack/react-query";
import { FC, useRef, useState, useEffect, ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Assuming these paths/components are available and have correct types

import { NewThread } from "./NewThread";

// Assuming Svg is a component that accepts standard HTML props and a 'type' prop
interface SvgProps extends React.SVGProps<SVGSVGElement> {
    type: string;
}
// Placeholder for Svg component
const Svg: FC<SvgProps> = (props) => (
    <svg {...props}>
        {/* Placeholder SVG content based on type */}
    </svg>
);


// --- Auth and Data Types ---

interface User {
    username: string;
    avatar?: string;
    karma: {
        user_karma: number;
    };
}

// Assuming AuthConsumer is aliased to useAuth and returns this shape
interface AuthContextType {
    isAuthenticated: boolean;
    user: User;
    logout: () => void;
}

// Placeholder hook for AuthContext
const useAuth = (): AuthContextType => {
    // In a real application, this would be the actual context consumer hook
    // Placeholder to satisfy typing (replace with actual hook import)
    return {} as AuthContextType; 
}

interface ThreadSearchResult {
    id: string;
    name: string;
    logo?: string;
    subscriberCount: number;
}

// --- Component Types ---

interface AppLogoProps {
    forBanner?: boolean;
    children?: ReactNode;
}

// ThreadSearch callback can return a thread name string or a structured object
type ThreadSearchCallbackValue = string | { id: string, name: string };

interface ThreadSearchProps {
    callBackFunc: (value: ThreadSearchCallbackValue) => void;
    forPost?: boolean;
}

// --- AppLogo Component ---

export const AppLogo: FC<AppLogoProps> = ({ forBanner = false, children }) => {
    if (forBanner) {
        return (
            <div className="hidden relative flex-col justify-center items-center space-y-5 rounded-md cursor-pointer md:flex group">
                <img src={threads} alt="threadit-logo" className="object-cover" />
                <span
                    className="hidden md:block absolute w-4 h-4
                             bg-theme-orange rounded-full bottom-[5.9rem] z-20 right-[8rem] group-hover:animate-bounce"></span>
                <span className="hidden md:block absolute w-4 h-4 bg-theme-cultured rounded-full bottom-[5.9rem] z-10 right-[8rem]"></span>
                <h1 className="font-mono text-6xl font-bold tracking-tight">Threaddit</h1>
                <p className="text-lg font-semibold">The Internet Home Place, where many communities reside</p>
                {children}
            </div>
        );
    }
    return (
        <Link to="/" className="flex relative items-center space-x-3 cursor-pointer group">
            <img src={threads} className="object-cover w-10 h-10" alt="threadit-logo" />
            <span
                className="hidden md:block absolute w-2 h-2 bg-theme-orange rounded-full
                             right-[1.4rem] top-[0.2rem] z-20 group-hover:animate-bounce"></span>
            <span className="hidden md:block absolute w-2 h-2 bg-white rounded-full right-[1.4rem] top-[0.2rem] z-10"></span>
            <h1 className="hidden font-mono text-3xl font-bold tracking-tight md:block">Threaddit</h1>
            {children}
        </Link>
    );
}

// --- ThreadSearch Component ---

export const ThreadSearch: FC<ThreadSearchProps> = ({ callBackFunc, forPost = false }) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState<string>("");

    const queryData = useQuery<ThreadSearchResult[]>({
        queryKey: ["threads/search", search],
        queryFn: async ({ signal }) => {
            // Manual Promise for simulated delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await axios.get<ThreadSearchResult[]>(`/api/threads/search`, {
                params: { name: search },
                signal,
            });
            return response.data;
        },
        enabled: search.length > 0 && search.replace(/\s/g, "").length > 0,
    });

    useClickOutside(searchRef, () => {
        setSearch("");
    });

    const threadNames = queryData.data ? queryData.data.map((thread) => thread.name) : [];
    
    // Type the subthread argument as Reddis, consistent with the expected data structure
    const handleThreadClick = (subthread: ThreadSearchResult) => {
        callBackFunc(forPost ? { id: subthread.id, name: subthread.name } : subthread.name);
        setSearch("");
    };

    const handleCreateThreadClick = () => {
        setShowModal(true);
        setSearch("");
    };

    return (
        <div
            className="flex items-center py-2.5 pl-2 md:p-2.5 space-x-3 rounded-md bg-neutral-100 relative"
            ref={searchRef}>
            <Svg type="search" className="w-6 h-6" />
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                name="search"
                id="search"
                className="py-0.5 w-48  md:w-full bg-neutral-100 focus:outline-none md:pr-20"
                placeholder="Find community"
            />
            {queryData.data && search && (
                <ul className="flex absolute right-0 top-full z-50 flex-col p-5 mt-3 space-y-5 w-full min-w-max list-none bg-white rounded-md border shadow-xl border-y-theme-gray-blue">
                    {queryData.data.slice(0, 5).map((subthread) => (
                        <li
                            className={`flex space-x-5 cursor-pointer ${!subthread.logo && "pl-[3.75rem]"} hover:bg-gray-50 p-2 rounded-md transition-colors`}
                            key={subthread.name}
                            onClick={() => handleThreadClick(subthread)}>
                            {subthread.logo && (
                                <img
                                    src={subthread.logo}
                                    className="object-cover w-10 h-10 rounded-full" 
                                    alt={`${subthread.name} logo`}
                                />
                            )}
                            <div className="flex flex-col">
                                <p className="text-sm font-semibold tracking-wide md:text-base">{subthread.name}</p>
                                <span className="text-xs font-light md:text-sm">{subthread.subscriberCount} Members</span>
                            </div>
                        </li>
                    ))}
                    {!threadNames.includes(`t/${search}`) && !forPost && (
                        <>
                            <span className="w-full border border-theme-orange"></span>
                            <div
                                className="flex justify-center items-center m-0 font-semibold cursor-pointer group hover:text-theme-orange transition-colors"
                                onClick={handleCreateThreadClick}>
                                <p className="text-sm md:text-base">Create subthread &quot;{search}&quot;</p>
                                <Svg type="arrow-right" className="w-6 h-6 duration-500 group-hover:translate-x-1" />
                            </div>
                        </>
                    )}
                </ul>
            )}
            {showModal && (
                <Modal setShowModal={setShowModal} showModal={showModal}>
                    <NewThread subThreadName={search} setShowModal={setShowModal} />
                </Modal>
            )}
        </div>
    );
}

// --- Navbar Component ---

export function Navbar() {
    // Use typed hook (assuming AuthConsumer is aliased to useAuth)
    const { isAuthenticated, user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleMobileSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value !== "logout") {
            navigate(value);
        } else {
            logout();
            // Ensure navigation after logout, typically to a public page
            navigate("/all"); 
        }
    };

    return (
        <nav className="flex justify-between items-center mx-1 h-16 md:p-5 bg-white shadow-sm border-b border-gray-100">
            <AppLogo />
            
            <div className="flex items-center md:space-x-10">
                <div
                    className={`list-none hidden md:flex space-x-10 text-gray-600 fill-current 
                                ${!isAuthenticated && "flex-1 space-x-20"}`}>
                    
                    {/* Home Link */}
                    <NavLink
                        to={`${isAuthenticated ? "/home" : "/login"}`}
                        className={({ isActive }) =>
                            `duration-500 group flex space-x-1 group cursor-pointer hover:text-theme-orange transition-colors ${isActive ? "text-theme-orange" : ""}`
                        }>
                        <Svg type="home" className="w-6 h-6" />
                        <h2 className="font-semibold">Home</h2>
                    </NavLink>
                    
                    {/* Popular Link */}
                    <NavLink
                        to="/popular"
                        className={({ isActive }) =>
                            `group flex space-x-1 group cursor-pointer hover:text-theme-orange transition-colors ${isActive ? "text-theme-orange" : ""}`
                        }>
                        <Svg type="popular" className="w-6 h-6" />
                        <h2 className="font-semibold">Popular</h2>
                    </NavLink>
                    
                    {/* All Link */}
                    <NavLink
                        to="/all"
                        className={({ isActive }) =>
                            `group flex space-x-1 group cursor-pointer hover:text-theme-orange transition-colors ${isActive ? "text-theme-orange" : ""}`
                        }>
                        <Svg type="all" className="w-6 h-6" />
                        <h2 className="font-semibold">All</h2>
                    </NavLink>
                </div>

                <ThreadSearch callBackFunc={(threadUrl) => navigate(threadUrl as string)} />
            </div>

            <div className="flex items-center md:space-x-6">
                {isAuthenticated && (
                    <>
                        {/* Saved Link */}
                        <NavLink to="/saved" className={({ isActive }) => `hidden md:block hover:text-theme-orange transition-colors ${isActive ? "text-theme-orange" : ""}`} title="saved">
                            <Svg type="save" className="w-6 h-6" />
                        </NavLink>
                        
                        {/* Inbox Link */}
                        <NavLink to="/inbox" className={({ isActive }) => `hidden md:block hover:text-theme-orange transition-colors ${isActive ? "text-theme-orange" : ""}`} title="inbox">
                            <Svg type="message" className="w-6 h-6" />
                        </NavLink>
                        
                        {/* User Profile Info (Desktop) */}
                        <Link
                            to={`/u/${user.username}`}
                            className="hidden md:flex items-center space-x-2 bg-theme-cultured rounded-3xl pr-3 py-0.5 group hover:bg-gray-200 transition-colors">
                            <img 
                                loading="lazy" 
                                width={40} 
                                height={40}
                                src={user.avatar || avatar}
                                className="object-cover w-10 h-10 rounded-full duration-500 cursor-pointer group-hover:scale-105"
                                alt={`${user.username}'s avatar`}
                            />
                            <div className="text-sm font-semibold">
                                <p className="text-gray-700">{user.username}</p>
                                <p className="text-gray-500 truncate">karma: {user.karma.user_karma}</p>
                            </div>
                        </Link>
                        
                        {/* Logout Button (Desktop) */}
                        <button onClick={logout} className="hidden flex-col items-center md:flex hover:text-red-600 transition-colors">
                            <Svg type="circle-logout" className="w-6 h-6 duration-300 rotate-180 hover:scale-110" />
                            <span className="text-sm font-semibold">Logout</span>
                        </button>
                    </>
                )}
                
                {/* Mobile Navigation Dropdown */}
                <select
                    name="page"
                    id="page"
                    className="px-1 py-3 mr-1 text-center rounded-md md:hidden bg-theme-cultured appearance-none cursor-pointer border border-gray-300"
                    onChange={handleMobileSelectChange}
                    value={location.pathname}>
                    <optgroup label="Feeds">
                        {isAuthenticated && <option value="/home">Home</option>}
                        <option value="/popular">Popular</option>
                        <option value="/all">All</option>
                    </optgroup>
                    <optgroup label="Other">
                        {isAuthenticated ? (
                            <>
                                <option value="/inbox">Inbox</option>
                                <option value="/saved">Saved</option>
                                <option value={`/u/${user.username}`}>Profile</option>
                                <option value="logout">Logout</option>
                            </>
                        ) : (
                            <>
                                <option value="/register">Register</option>
                                <option value="/login">Login</option>
                            </>
                        )}
                    </optgroup>
                </select>
            </div>

            {/* Login Link (Desktop - Not Authenticated) */}
            {!isAuthenticated && (
                <Link to="/login" className="hidden font-semibold cursor-pointer md:flex text-theme-orange group hover:text-orange-700 transition-colors">
                    Login
                    <Svg
                        type="arrow-right"
                        className="invisible w-6 h-6 duration-200 group-hover:visible text-theme-orange group-hover:translate-x-1"></Svg>
                </Link>
            )}
        </nav>
    );
}

export default Navbar;
