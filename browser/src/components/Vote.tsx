import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useState, FC } from "react";
import useAuthContext from "./AuthContext";
import Svg from "./Svg";

// type Definitions
/** Type for the vote state: true for upvote, false for downvote, null for no vote. */
type VoteType = boolean | null;

/**
 * Interface for the component props.
 * Note: Typo 'intitalVote' from original code has been corrected to 'initialVote' here.
 */
interface VoteProps {
    url: string;
    initialCount: number;
    initialVote: VoteType;
    contentID: number;
    type?: "mobile" | "desktop"; // Explicitly defining the expected string values
}

/** Interface for the variables passed to the useMutation function. */
interface MutationVariables {
    vote: VoteType;
    method: "put" | "patch" | "delete";
    contentID: number;
}

// Component Implementation
/**
 * Component for handling voting on content (posts or comments) with optimistic updates
 * and TanStack Query mutations.
 */
export const Vote: FC<VoteProps> = ({ url, initialVote, initialCount, contentID, type }) => {
  // State for the current user's vote status and the displayed total count.
    const [vote, setVote] = useState<VoteType>(initialVote);
    const [voteCount, setVoteCount] = useState<number>(initialCount);

  // Assuming useAuthContext returns an object with isAuthenticated: boolean
    const { isAuthenticated }: { isAuthenticated: boolean } = useAuthContext();

    // Mutation logic for updating the vote on the server
    const { mutate } = useMutation<unknown, Error, MutationVariables>({
    mutationFn: async ({ vote, method, contentID }) => {
        const endpoint = `${url}/${contentID}`;
        switch (method) {
        case "put":
        // Initial vote (from null to true/false)
        // The body sends the new vote state (true for upvote, false for downvote)
            return axios.put(endpoint, { is_upvote: vote });
        case "patch": // Changing vote direction (true to false, or false to true)
            return axios.patch(endpoint, { is_upvote: vote });
        case "delete": // Removing vote (true/false to null)
            return axios.delete(endpoint);
        default:
            return Promise.resolve();
      }
    },
    // In a real app, onSuccess/onError should be used for full error handling 
    // and query invalidation.
  });

  /**
   * Handles the local state update and triggers the remote mutation.
   * @param newVote The vote state to transition to (true, false, or null).
   */
    function handleVote(newVote: VoteType) {
    if (!isAuthenticated) {
      // IMPORTANT: alert() is not supported in this environment. 
      // Replace with a custom modal or toast notification UI.
        console.error("Authentication Required: You must be logged in to vote.");
        return;
    }

    // Define the method based on the current and new vote states
    let method: "put" | "patch" | "delete";
    let countChange = 0;

    if (vote === null) {
      // 1. No vote -> New vote (PUT)
        method = "put";
        countChange = newVote ? 1 : -1;
    } else if (newVote === null) {
      // 2. Existing vote -> Remove vote (DELETE)
        method = "delete";
      countChange = vote ? -1 : 1; // If it was an upvote (true), subtract 1. If it was a downvote (false), add 1.
    } else {
      // 3. Change vote direction (PATCH)
        method = "patch";
      // Changing from down (-1) to up (+1) is +2. Changing from up (+1) to down (-1) is -2.
        countChange = newVote ? 2 : -2;
    }

    // Optimistic state update
    setVoteCount((prevCount) => prevCount + countChange);
    setVote(newVote);

    // Trigger server mutation
    mutate({ vote: newVote, method, contentID });
    }
  // Determine the color class for the vote count based on the current vote state
    const voteClass = vote === true ? "text-theme-red-coral" : vote === false ? "text-sky-600" : "";

  // Render logic based on 'type' prop (mobile or desktop)
    return type === "mobile" ? (
    // Mobile Layout: Uses mobileVote icon and displays count inline
    <>
        <Svg
        type="mobileVote"
        className="w-5 h-5 md:w-6 md:h-6"
        defaultStyle={true}
        active={vote === true}
        // If already upvoted (true), clicking removes the vote (null). Otherwise, upvote (true).
        onClick={() => handleVote(!vote ? true : null)}
        />
        <p className={voteClass}>{voteCount}</p>
        <Svg
        type="mobileVote"
        className="w-5 h-5 rotate-180 md:w-6 md:h-6"
        defaultStyle={false}
        active={vote === false}
        // If already downvoted (false), clicking removes the vote (null). Otherwise, downvote (false).
        onClick={() => handleVote(vote === false ? null : false)}
        />
    </>
    ) : (
    // Desktop Layout: Uses down-arrow icon (rotated for upvote)
    <>
      {/* Upvote Button (Red/Coral style) */}
        <div className="px-5 py-0.5 bg-orange-100 rounded-md">
        <Svg
            type="down-arrow"
            defaultStyle={true}
            className="w-10 h-10 rotate-180"
            onClick={() => handleVote(!vote ? true : null)}
            active={vote === true}
        />
        </div>
      {/* Vote Count */}
        <p className="text-lg font-semibold">
        <span className={voteClass}>
            {voteCount}
        </span>
        </p>
      {/* Downvote Button (Sky-blue style) */}
        <div className="px-5 py-0.5 bg-blue-50 rounded-md group">
        <Svg
            type="down-arrow"
            className="w-10 h-10"
            defaultStyle={false}
            onClick={() => handleVote(vote === false ? null : false)}
            active={vote === false}
        />
        </div>
    </>
  );
}

export default Vote;
