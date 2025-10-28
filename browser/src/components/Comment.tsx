import { AnimatePresence, motion } from "framer-motion";
import Markdown from "markdown-to-jsx";
import { FC, useRef, useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import avatar from "../assets/avatar.png";
import useComment from "../hooks/useComment";
import { timeAgo } from "../pages/fullPost/utils";
import { useAuth } from "./AuthContext"; // Changed from AuthConsumer
import Svg from "./Svg";
import Vote from "./Vote";

// Type Definitions
// From AuthContext (inferred)
interface UserType {
username: string;
avatar?: string;
mod_in: string[];
roles: string[];
}

// From comment prop (inferred from usage)
interface CommentInfoType {
id: number;
created_at: string; // ISO date string
is_edited: boolean;
content: string;
comment_karma: number;
}

interface UserInfoType {
user_avatar?: string;
user_name: string;
}

interface CurrentUserType {
has_upvoted: boolean | null; // Based on Vote.tsx's VoteType
}

// The structure of the main comment object
interface CommentDataType {
comment: {
    comment_info: CommentInfoType;
    user_info: UserInfoType;
    current_user: CurrentUserType;
};
children: CommentDataType[]; // Recursive structure
}

// Props for the main Comment component
interface CommentProps {
children: CommentDataType[];
comment: CommentDataType;
threadID: string;
commentIndex: number;
parentDelete?: ((commentId: number) => void) | null;
}

// Return type of the useComment hook (inferred)
interface UseCommentReturn {
commentChildren: CommentDataType[];
commentInfo: CommentInfoType;
userInfo: UserInfoType;
currentUser: CurrentUserType;
addComment: (data: string) => void;
deleteComment: (childId?: number) => void;
updateComment: (data: string) => void;
colorSquence: () => string;
}

// Props for the CommentMode component
interface CommentModeProps {
user: UserType;
colorSquence?: () => string;
callBackSubmit: (data: string) => void;
callBackCancel: () => void;
defaultValue?: string | null;
}

/**
 * Safely copies text to the clipboard with a fallback for iFrame environments.
 * @param text The text to copy.
 */
function copyToClipboard(text: string) {
if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
    console.log("Link Copied to Clipboard");
    // In a real app, trigger a toast notification here.
    }).catch(err => {
    console.warn("Clipboard write failed, using fallback:", err);
    fallbackCopy(text);
    });
} else {
    fallbackCopy(text);
}
}

/** Fallback copy method using document.execCommand. */
function fallbackCopy(text: string) {
const textArea = document.createElement("textarea");
textArea.value = text;

// Avoid scrolling to bottom
textArea.style.top = "0";
textArea.style.left = "0";
textArea.style.position = "fixed";

document.body.appendChild(textArea);
textArea.focus();
textArea.select();

try {
    const successful = document.execCommand("copy");
    if (successful) {
    console.log("Link Copied to Clipboard (fallback)");
    // In a real app, trigger a toast notification here.
    } else {
    console.error("Fallback: Copying text command was unsuccessful");
    }
} catch (err) {
    console.error("Fallback: Oops, unable to copy", err);
}

document.body.removeChild(textArea);
}

// Main Comment Component

export const Comment: FC<CommentProps> = ({ children, comment, threadID, commentIndex, parentDelete = null }) => {
const listRef = useRef<HTMLSelectElement>(null);
const [isReply, setIsReply] = useState(false);
const [editMode, setEditMode] = useState(false);
const [expandChildren, setExpandChildren] = useState(true); // Default to expanded

// useComment returns typed data based on our inferred interface
const {
    commentChildren,
    commentInfo,
    userInfo,
    currentUser,
    addComment,
    deleteComment,
    updateComment,
    colorSquence,
}: UseCommentReturn = useComment({
    children,
    comment,
});

const { isAuthenticated, user } = useAuth(); // Replaced AuthConsumer
const timePassed = timeAgo(new Date(commentInfo.created_at));

function handleSelect(value: string) {
    switch (value) {
    case "delete":
        if (parentDelete) {
        parentDelete(commentInfo.id);
        } else {
        deleteComment();
        }
        if (listRef.current) listRef.current.value = "more";
        break;
    case "edit":
        setEditMode(true);
        break;
    case "share":
        copyToClipboard(window.location.href); // Replaced alert
        if (listRef.current) listRef.current.value = "more";
        break;
    }
}

return (
    <motion.li
    className={`py-3 pl-2 space-y-2 w-full bg-white rounded-xl md:text-base ${!parentDelete && "border"}`}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: commentIndex * 0.15 }}
    exit={{ opacity: 0, y: -10, transition: { duration: 0.1 } }}>
    {editMode ? (
        <CommentMode
        callBackSubmit={(data) => {
            updateComment(data);
            setEditMode(false);
            if (listRef.current) listRef.current.value = "more";
        }}
        callBackCancel={() => {
            setEditMode(false);
            if (listRef.current) listRef.current.value = "more";
        }}
        defaultValue={commentInfo.content}
        user={user as UserType} // Assert user type if useAuth() returns a broader type
        />
    ) : (
        <>
        <div className="flex items-center space-x-2 text-sm font-medium">
            <img loading="lazy" width="20" height="20" src={userInfo.user_avatar || avatar} alt="" className="object-cover w-5 h-5 rounded-full" />
            <Link to={`/u/${userInfo.user_name}`} className="font-medium text-blue-600 hover:underline">
            {userInfo.user_name}
            </Link>
            <p>{timePassed}</p>
            {commentInfo.is_edited && <p>(Edited)</p>}
        </div>
        <div className="max-w-full text-black prose prose-sm md:prose-base prose-blue">
            <Markdown className="[&>*:first-child]:mt-0">{commentInfo.content}</Markdown>
        </div>
        </>
    )}
    <div className="flex justify-around items-center md:justify-between md:mx-10">
        {isAuthenticated && user && (user.username === userInfo.user_name || user.mod_in.includes(threadID) || user.roles.includes("admin")) ? (
        <select
            defaultValue={"more"}
            ref={listRef}
            name="more-options"
            title="More Options"
            id="more-options"
            className="text-sm bg-white md:px-2 md:text-base"
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleSelect(e.target.value)}>
            <option value="more">More</option>
            <option value="share">Share</option>
            {user.username === userInfo.user_name && <option value="edit">Edit</option>}
            <option value="delete">Delete</option>
        </select>
        ) : (
        <div className="flex items-center space-x-1 cursor-pointer" onClick={() => copyToClipboard(window.location.href)}>
            <Svg type="share" className="w-4 h-4" />
            <p className="text-sm md:text-base">Share</p>
        </div>
        )}
        <div
        className="flex items-center space-x-1 cursor-pointer"
        onClick={() => {
            if (!isAuthenticated) {
            console.error("User must be logged in to reply.");
            // In a real app, trigger a login modal
            } else {
            setIsReply(!isReply);
            }
        }}>
        <Svg type="comment" className="w-4 h-4" />
        <p className="text-sm md:text-base">Reply</p>
        </div>
        <div
        className={`${!commentChildren.length && "invisible"} flex items-center space-x-1 cursor-pointer`}
        onClick={() => setExpandChildren(!expandChildren)}>
        <Svg type="down-arrow" className={`w-4 h-4 transition-transform ${expandChildren && "rotate-180"}`} />
        <p className="text-sm md:text-base">{expandChildren ? "Hide" : "Show"}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm md:text-base">
        <Vote
            url="/api/reactions/comment"
            initialVote={currentUser?.has_upvoted} // Fixed typo from intitalVote
            initialCount={commentInfo.comment_karma}
            contentID={commentInfo.id}
            type="mobile"
        />
        </div>
    </div>
    {isReply && (
        <CommentMode
        callBackSubmit={(data) => {
            if (listRef.current) listRef.current.value = "more";
            addComment(data);
            setIsReply(false);
            setExpandChildren(true);
        }}
        callBackCancel={() => {
            setIsReply(false);
            if (listRef.current) listRef.current.value = "more";
        }}
        colorSquence={colorSquence}
        user={user as UserType} // Assert user type
        />
    )}
    <AnimatePresence mode="wait">
        {expandChildren && (
        <ul className={commentChildren.length > 0 && expandChildren ? "border-l-2 " + colorSquence() : ""}>
            {commentChildren.map((child, index) => (
            <Comment
                key={child.comment.comment_info.id}
                {...child}
                commentIndex={index}
                parentDelete={deleteComment}
                threadID={threadID} // Pass threadID down
            />
            ))}
        </ul>
        )}
    </AnimatePresence>
    </motion.li>
);
}


export default Comment;
