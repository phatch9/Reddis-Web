import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Markdown from "markdown-to-jsx";
import { useState, FormEvent, ChangeEvent } from "react";
// import avatar from "../assets/avatar.png";
import useAuth from "./AuthContext"; // Using the previously defined useAuth hook
import Loader from "./Loader";
import { ReadSearch } from "./Navbar";
import Svg from "./Svg"; // Assuming Svg component interface/type is correct

// Fallback avatar image (page-local files use similar placeholder). Replace with app asset if available.
const avatar = "https://placehold.co/150x150/f0f0f0/333333?text=Avatar";

// Interface Definitions

interface PostInfo {
    id: number;
    title: string;
    content: string;
    // Add other fields that might be needed
    [key: string]: any;
}

interface ReadInfo {
    read_id: number;
    read_name: string;
}

interface ReadState {
    id: number;
    name: string;
}

interface NewPostProps {
    setShowModal: (show: boolean) => void;
    isEdit?: boolean;
    postInfo?: Partial<PostInfo>;
    readInfo?: Partial<ReadInfo>;
}

// Component Implementation

export default function NewPost({
    setShowModal,
    isEdit = false,
    postInfo = {},
    readInfo = {}
}: NewPostProps) {
    const queryClient = useQueryClient();
    
    // State initialization with types
    const [title, setTitle] = useState<string>(postInfo?.title || "");
    const [content, setContent] = useState<string>(postInfo?.content || "");
    const [media, setMedia] = useState<File | null>(null); // For file uploads
    const [preMd, setPreMd] = useState<boolean>(false);
    const [mediaType, setMediaType] = useState<"media" | "url">(postInfo?.content_type === "url" ? "url" : "media");
    const [imageUrl, setImageUrl] = useState<string>(postInfo?.content_url || ""); // For external URLs
    const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for displaying errors

    // Initialize read state, handling both creation (false) and editing (object) scenarios
    const [read, setread] = useState<ReadState | false>(
        isEdit && readInfo.read_id && readInfo.read_name
            ? { id: readInfo.read_id, name: readInfo.read_name }
            : false
    );
    
    // Use the typed hook from AuthProvider.tsx
    const { user } = useAuth();

    /**
     * Handles file selection and validates size (10MB limit).
     */
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 10MB limit in bytes
            const maxFileSize = 10 * 1024 * 1024; 
            if (file.size > maxFileSize) {
                // Display error message instead of alert()
                setErrorMessage(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Only upload files less than 10MB.`);
                // Clear the file input and state
                e.target.value = ''; 
                setMedia(null);
            } else {
                setErrorMessage(null);
                setMedia(file);
            }
        }
    };

    // useMutation hook
    const { mutate: handleSubmit, status } = useMutation({
        mutationFn: async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            if (!title || !read) {
                setErrorMessage("Title and read selection are mandatory.");
                return;
            }
            setErrorMessage(null); // Clear previous errors on new attempt

            const formData = new FormData();
            formData.append("title", title);
            formData.append("content_type", mediaType);
            formData.append("content_url", imageUrl);
            formData.append("content", content);
            
            if (media) {
                formData.append("media", media, media.name);
            }
            
            // Append read ID (converted to string for FormData)
            formData.append("subread_id", String(read.id));

            try {
                if (!isEdit) {
                    // CREATE POST
                    await axios
                        .post("/api/post", formData, { headers: { "Content-Type": "multipart/form-data" } });
                } else {
                    // EDIT POST
                    if (!postInfo.id) {
                        setErrorMessage("Cannot edit post: Post ID is missing.");
                        return;
                    }

                    const res = await axios.patch<{ new_data: PostInfo }>(`/api/post/${postInfo.id}`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    queryClient.setQueryData(["post/comment", `${postInfo.id}`], (oldData: any) => ({...oldData, 
                        post_info: res.data.new_data,
                    })); // Update post data in cache
                }
                
                // On success
                setShowModal(false);
                queryClient.invalidateQueries({ queryKey: ["posts"] }); // Invalidate general post list

            } catch (err: any) {
                console.error("Submission failed:", err);
                // Display visible error message instead of alert
                setErrorMessage(`Submission failed: ${err.message || "Please check your fields."}`);
            }
        },
    });

    return (
        <div className="flex flex-col w-5/6 p-5 space-y-5 rounded-md h-4/6 blur-none md:w-3/4 md:h-5/6 md:p-10 bg-theme-cultured">
            <div className="flex flex-col items-center justify-between p-4 space-y-3 bg-white rounded-xl md:flex-row md:space-y-0">
                <div className="flex items-center space-x-3">
                    <p>{isEdit ? "Editing" : "Posting"} as</p>
                    <img
                        src={user.avatar || avatar}
                        className="object-cover w-8 h-8 rounded-full md:w-12 md:h-12"
                        alt="User avatar"
                    />
                    <p>{user.username}</p>
                </div>
                {status === "pending" && <Loader forPosts={true} />}
                <div className="flex items-center mr-2 space-x-2 md:space-x-3">
                    <p className="hidden md:block">{isEdit ? "Editing" : "Posting"} on</p>
                    <p className="md:hidden">On</p>
                    {read ? (
                        <div className="flex items-center p-1 space-x-3">
                            <p className="tracking-wide medium text- md:text-base text-theme-orange">{read.name}</p>
                            <Svg type="delete" className="w-7 h-7 text-theme-orange cursor-pointer" onClick={() => setread(false)} />
                        </div>
                    ) : (
                        {/* Use ReadSearch component exported from Navbar */}
                        <ReadSearch
                            callBackFunc={(value) => {
                                // Handle both string and object responses
                                if (typeof value === 'string') {
                                    // Parse expected format: "t/subredditname"
                                    const name = value.replace(/^t\//, '');
                                    setread({ id: -1, name }); // Temporary ID until API call
                                } else {
                                    setread({ id: parseInt(value.id), name: value.name });
                                }
                            }}
                            forPost={true}
                        />
                    )}
                </div>
            </div>
            
            {/* Error Message Display */}
            {errorMessage && (
                <div className="p-3 text-sm font-semibold text-white bg-red-500 rounded-md">
                    {errorMessage}
                </div>
            )}

            <form
                encType="multipart/form-data"
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 justify-around p-1.5 w-full h-1/2 bg-white rounded-md">
                
                <label htmlFor="title">
                    <span>Title</span>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        type="text"
                        name="title"
                        id="title"
                        className="w-full p-1 border-b border-gray-800 focus:outline-none focus:border-theme-orange"
                        required
                    />
                </label>
                
                <label htmlFor="content" className="">
                    <span>{preMd ? "Markdown Preview" : "Content"}</span>
                    <button
                        type="button"
                        className="active:scale-90 ml-5 my-0.5 py-0.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                        onClick={() => setPreMd(!preMd)}>
                        {preMd ? "Close Preview" : "Preview Markdown"}
                    </button>
                    <div className="flex flex-col space-y-2">
                        {preMd ? (
                            <div className="max-w-full p-2 overflow-auto prose border border-gray-800 h-28 rounded-md">
                                <Markdown options={{ forceBlock: true, wrapper: "div" }} className="w-full">
                                    {content.replace("\n", "<br />\n") || "This is markdown preview"}
                                </Markdown>
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                name="content"
                                id="content"
                                className="w-full p-2 border border-gray-800 h-28 md:max-h-32 focus:outline-none focus:border-theme-orange rounded-md"
                            />
                        )}
                    </div>
                </label>
                
                <label htmlFor="media" className="flex flex-col items-center space-y-3 md:space-y-0 md:space-x-5 md:flex-row">
                    <select
                        className="px-10 py-2 bg-white border rounded-md md:px-12 focus:ring-2 focus:ring-theme-orange"
                        name="mediaType"
                        id="mediaType"
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as "media" | "url")}>
                        <option value="media">Upload Media</option>
                        <option value="url">External URL</option>
                    </select>
                    
                    {mediaType === "media" ? (
                        <div className="flex-1 w-full">
                            <input
                                onChange={handleFileChange}
                                type="file"
                                name="media"
                                alt="media"
                                accept="image/*, video/*"
                                id="media"
                                className="w-full focus:outline-none file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-theme-cultured file:text-theme-orange hover:file:bg-gray-100"
                            />
                            {media && <p className="text-xs text-gray-500 mt-1">File selected: {media.name}</p>}
                        </div>
                    ) : (
                        <input
                            type="url" // Using type="url" for better browser validation
                            name="media_url"
                            id="media_url"
                            placeholder="Enter image or video URL"
                            className="w-full p-2 border border-gray-800 rounded-md focus:outline-none focus:border-theme-orange"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />
                    )}
                </label>
                
                {isEdit && (
                    <span className="text-xs font-semibold text-blue-500">
                        * Only add a new image/URL if you want to replace the original. Leave empty to keep the existing media.
                    </span>
                )}
                
                <button
                    type="submit"
                    disabled={status === "pending"}
                    className="py-2 font-semibold text-white rounded-md bg-theme-orange hover:bg-orange-600 active:scale-95 transition-all disabled:bg-gray-400">
                    {status === "pending" ? "Submitting..." : isEdit ? "Save Changes" : "Create Post"}
                </button>
            </form>
        </div>
    );
}
