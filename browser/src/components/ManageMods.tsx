import { focusManager, useMutation, useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { FC, useEffect, useState } from "react";
import Svg from "./Svg";
import Loader from "./Loader";

// Type Definitions
/** Props for the ManageMods component. */
interface ManageModsProps {
  mods: string[];
  threadId: number;
}

/**
 * Shape of the user object returned from the search API.
 */
interface UserSearchResult {
  username: string;
  // Add other user properties here if available, e.g., avatar
}

/**
 * Variables for the add/remove mod mutation.
 */
interface MutationVariables {
  username: string;
  isDelete?: boolean;
}

/**
 * Expected shape of an API error response.
 */
interface ApiErrorResponse {
  message: string;
}

// Component Implementation

export const ManageMods: FC<ManageModsProps> = ({ mods, threadId }) => {
  const [modList, setModList] = useState<string[]>(mods);
  const [search, setSearch] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Query for searching users to add as mods.
   */
  const { data, isFetching } = useQuery<UserSearchResult[], Error>({
    queryKey: ["search/user", search],
    queryFn: async ({ signal }) => {
      return await axios
        .get(`/api/user/search/${search}`, { signal })
        .then((data) => data.data);
    },
    enabled: search.length > 3, // Only search when 4+ chars are typed
  });

  /**
   * Disable query retries when component is not focused (e.g., window blurred).
   */
  useEffect(() => {
    focusManager.setFocused(false);
    return () => focusManager.setFocused(true);
  }, []);

  /**
   * Mutation for adding or removing a mod.
   */
  const { mutate, isPending: isMutating } = useMutation<
    any,
    Error,
    MutationVariables
  >({
    mutationFn: async ({ username, isDelete = false }) => {
      setErrorMessage(null); // Clear previous errors on a new attempt
      if (isDelete) {
        return await axios
          .delete(`/api/thread/mod/${threadId}/${username}`)
          .then((res) => {
            setModList((prevList) =>
              prevList.filter((user) => user !== username)
            );
            return res.data;
          });
      } else {
        return await axios
          .put(`/api/thread/mod/${threadId}/${username}`)
          .then((res) => {
            setModList((prevList) => [...prevList, username]);
            setSearch(""); // Clear search input after successfully adding
            return res.data;
          });
      }
    },
    onError: (err) => {
      // Handle errors and display them to the user
      if (axios.isAxiosError(err)) {
        const errorData = err.response?.data as ApiErrorResponse;
        const message =
          errorData?.message ||
          "An error occurred. Only admins can remove the thread creator.";
        setErrorMessage(`${err.message} - ${message}`);
      } else {
        setErrorMessage(err.message || "An unknown error occurred.");
      }
    },
  });

  // Event handlers

  const handleRemoveMod = (username: string) => {
    if (isMutating) return; // Prevent multiple clicks
    mutate({ username, isDelete: true });
  };

  const handleAddMod = (username: string) => {
    if (isMutating) return;
    mutate({ username, isDelete: false });
  };

  // Render

  return (
    <div className="w-5/6 h-5/6 bg-white rounded-md p-4 flex flex-col shadow-xl">
      <h1 className="pt-2 text-2xl font-semibold text-center text-theme-orange">
        Manage Moderators
      </h1>

      {/* Error Message Display */}
      {errorMessage && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md my-3"
          role="alert"
        >
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {/* Current Mod List */}
      <h2 className="text-lg font-medium text-gray-700 mt-4 mb-2">
        Current Mods
      </h2>
      <ul className="overflow-auto relative p-3 m-0 space-y-2 max-h-[30vh] list-none bg-theme-cultured rounded-md border">
        {modList.map((mod) => (
          <li
            key={mod}
            className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm"
          >
            <span className="font-medium">{mod}</span>
            <button
              onClick={() => handleRemoveMod(mod)}
              disabled={isMutating}
              className="p-1 rounded-full hover:bg-red-100 disabled:opacity-50 transition-colors"
              title={`Remove ${mod}`}
            >
              <Svg
                type="delete"
                className="w-6 h-6 font-bold text-theme-orange"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Add Mod Section */}
      <div className="flex flex-col mt-4 flex-1 min-h-0">
        <h2 className="text-lg font-medium text-gray-700 mb-2">Add Mod</h2>
        <input
          type="text"
          name="username"
          id="username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 font-semibold border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-orange"
          placeholder="Enter username (min 4 chars)"
        />

        {/* Search Results */}
        <div className="flex-1 overflow-hidden mt-2">
          {isFetching ? (
            <div className="flex justify-center items-center h-full">
              <Loader forPosts={true} />
            </div>
          ) : (
            data && (
              <ul className="overflow-auto h-full relative p-3 space-y-2 list-none rounded-md bg-theme-cultured border">
                {data.length === 0 && search.length > 3 && (
                  <li className="text-gray-500 text-center">
                    No users found.
                  </li>
                )}
                {data.map(
                  (user) =>
                    !modList.includes(user.username) && (
                      <li
                        key={user.username}
                        className="flex justify-between items-center p-2 px-3 bg-white rounded-md shadow-sm"
                      >
                        <span className="font-medium">{user.username}</span>
                        <button
                          onClick={() => handleAddMod(user.username)}
                          disabled={isMutating}
                          className="p-1 rounded-full hover:bg-green-100 disabled:opacity-50 transition-colors"
                          title={`Add ${user.username}`}
                        >
                          <Svg
                            type="add"
                            className="w-6 h-6 font-bold text-green-600"
                          />
                        </button>
                      </li>
                    )
                )}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageMods;
