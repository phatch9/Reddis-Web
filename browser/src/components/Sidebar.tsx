import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FC } from "react";
import { Link } from "react-router-dom";

// Type definitions

interface Thread {
  id?: string;
  name: string;
  logo?: string;
  subscriberCount?: number;
}

interface ThreadData {
  subscribed: Thread[];
  all: Thread[];
  popular: Thread[];
}

interface SideBarComponentProps {
  threadList?: Thread[];
}

// Helper Component

const SideBarComponent: FC<SideBarComponentProps> = ({ threadList }) => (
  <div className="flex flex-col space-y-4 w-48 list-none">
    {threadList?.slice(0, 10).map((thread) => (
      <Link
        to={`/${thread.name}`}
        key={`thread-${thread.id ?? thread.name}`}
        className="flex justify-between items-center w-48 cursor-pointer hover:bg-gray-100 p-1 rounded-md"
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
          {String(thread.subscriberCount ?? 0).padStart(2, "0")}
        </span>
      </Link>
    ))}
  </div>
);

// Main Sidebar

export function Sidebar() {
  const { data, isLoading, isError } = useQuery<ThreadData, Error>({
    queryKey: ["threads/all"],
    queryFn: async () => {
      const res = await axios.get("/api/threads");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <aside className="hidden md:flex flex-col w-56 p-5 space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded w-40" />
        ))}
      </aside>
    );
  }

  if (isError) {
    return (
      <aside className="hidden flex-col w-56 md:flex p-5">
        <p className="text-red-500">Failed to load threads.</p>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-56">
      {/* Subscribed Threads */}
      {data?.subscribed?.length > 0 && (
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

export default Sidebar;
