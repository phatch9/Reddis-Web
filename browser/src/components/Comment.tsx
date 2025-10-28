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



export default Comment;
