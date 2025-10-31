import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FC } from "react";
import { Link } from "react-router-dom";

// Type Definitions

/** Defines the structure of a single thread item. */
interface Thread {
    id: string; // Assuming 'id' is available, otherwise 'name' can be the key
    name: string;
    logo?: string;
    subscriberCount: number;
}

/** Defines the structure of the data returned by the API. */

interface ThreadData {
    subscribed: Thread[];
    all: Thread[];
    popular: Thread[];
}

/** Props for the SideBarComponent helper. */
interface SideBarComponentProps {
    threadList?: Thread[];
}

// Helper Component
/** Renders a list of thread links. */
const SideBarComponent: FC<SideBarComponentProps> = ({ threadList }) => {
    return (
    <div className="flex flex-col space-y-4 w-48 list-none">
      {/* Slice to show top 10, then map over them */}
        {threadList?.slice(0, 10).map((thread) => (
        <Link 
            to={`/${thread.name}`} 
            className="flex justify-between items-center w-48 cursor-pointer hover:bg-gray-100 p-1 rounded-md" 
          key={thread.id || thread.name} // Use ID if available, fallback to name
        >
            <div className={`flex items-center space-x-3 ${!thread.logo && "pl-9"}`}>
            {thread.logo && (
                <img
                loading="lazy"
                width="24"
                height="24"
                src={thread.logo}
                alt={`${thread.name} logo`}
                className="object-cover w-6 h-6 rounded-full"
                />
            )}
            <span className="truncate text-sm font-medium">{thread.name}</span>
          </div>
          <span className="p-1 px-2 text-xs font-semibold rounded-md bg-theme-gray-blue text-white">
            {/* Ensure two-digit formatting for counts under 10 */}
            {thread.subscriberCount > 9 ? thread.subscriberCount : `0${thread.subscriberCount}`}
          </span>
        </Link>
      ))}
    </div>
  );
};

// --- Main Sidebar Component ---

/**
 * Main sidebar component that fetches and displays thread lists.
 */
export function ThreadsSidebar() {
  const { data, isLoading, isError } = useQuery<ThreadData, Error>({
    queryKey: ["threads/all"],
    queryFn: async () => {
      return await axios.get("/api/threads").then((res) => res.data);
    },
  });

  // Handle loading state
  if (isLoading) {
    return (
      <aside className="hidden flex-col w-56 md:flex p-5">
        <p className="text-gray-500">Loading threads...</p>
      </aside>
    );
  }

// Handle error state
if (isError) {
    return (
        <aside className="hidden flex-col w-56 md:flex p-5">
            <p className="text-red-500">Failed to load threads.</p>
        </aside>
    );
}

  return (
    <aside className="hidden flex-col w-56 md:flex">
      {/* Subscribed Threads */}
      {data?.subscribed && data.subscribed.length > 0 && (
        <>
          <div className="flex flex-col m-5 space-y-4">
            <div className="flex justify-between w-48 cursor-pointer">
              <h2 className="font-semibold uppercase">Subscribed</h2>
              <span className="pr-1">ALL</span>
            </div>
            <SideBarComponent threadList={data.subscribed} />
          </div>
          <span className="mx-5 border border-theme-silver-chalice"></span>
        </>
      )}

      {/* Top Threads */}
      <div className="flex flex-col m-5 space-y-4">
        <div className="flex justify-between w-48 cursor-pointer">
          <h2 className="font-semibold uppercase">Top Threads</h2>
          <span className="pr-1">ALL</span>
        </div>
        <SideBarComponent threadList={data?.all} />
      </div>
      <span className="mx-5 border border-theme-silver-chalice"></span>

      {/* Popular Threads */}
      <div className="flex flex-col m-5 space-y-4">
        <div className="flex justify-between w-48 cursor-pointer">
            <h2 className="font-semibold uppercase">Popular Threads</h2>
            <span className="pr-1">ALL</span>
        </div>
        <SideBarComponent threadList={data?.popular} />
        </div>
    </aside>
    );
}

export default ThreadsSidebar;

