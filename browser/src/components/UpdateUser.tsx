import AuthConsumer from "./AuthContext";
import { FormEvent, ChangeEvent } from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { focusManager, useQueryClient } from "@tanstack/react-query";

// Interface Definition
/* Props for the UpdateUser component. */
interface UpdatePropTypes {
    setModal: (show: boolean) => void;
}
export type User = {
    username: string;
    avatar?: string;
    bio?: string;
};

// Component Implementation
export default function UpdateUser({ setModal }: UpdatePropTypes) {
    const queryClient = useQueryClient();
    const { user } = AuthConsumer();

    // State initialization with types
    const [bio, setBio] = useState<string>(user.bio || "");
    const [media, setMedia] = useState<File | null>(null);
    const [mediaType, setMediaType] = useState<"image" | "url">("image");
    const [imageUrl, setImageUrl] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    /** Handles file selection and validates size (10MB limit).*/
    
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 10MB limit in bytes
            const maxFileSize = 10 * 1024 * 1024;
            if (file.size > maxFileSize) {
                setErrorMessage("File too large. Only upload files less than 10MB.");
                e.target.value = ''; // Clear input
                setMedia(null);
            } else {
                setErrorMessage(null);
                setMedia(file);
            }
        }
    };

    /* Handles form submission to update the user profile.*/
    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append("bio", bio);
        formData.append("content_type", mediaType);
        formData.append("content_url", imageUrl);

        // Only append media file if it exists
        if (media) {
            formData.append("avatar", media, media.name);
        }

        try {
            const res = await axios.patch("/api/user", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // On success: close modal and update react-query cache
            setModal(false);

            // Update user cache keys
            const updatedUser: User = res.data as User;
            queryClient.setQueryData<User>(["user", user.username], () => updatedUser);
            queryClient.setQueryData<User>(["user"], () => updatedUser);

        } catch (err: any) {
            console.error("Profile update failed:", err);
            setErrorMessage(`Update failed: ${err.message || "Please check your input fields."}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Effect to manage react-query focus (as in original JS)
    useEffect(() => {
        focusManager.setFocused(false);
        return () => focusManager.setFocused(true);
    }, []);

    return (
        <div className="flex flex-col p-5 space-y-5 w-5/6 rounded-md min-h-3/6 md:w-3/4 md:p-10 bg-theme-cultured">
            <div className="flex flex-col justify-between items-center p-4 space-y-3 bg-white rounded-xl md:flex-row md:space-y-0">
                <p className="text-lg font-semibold">Updating Profile for</p>
                <img
                    src={user.avatar || avatar}
                    className="object-cover w-12 h-12 rounded-full md:w-16 md:h-16 shadow-md" 
                    alt={`${user.username}'s avatar`}
                />
                <p className="text-xl font-bold text-theme-orange">{user.username}</p>
            </div>
            
            {/* Error Message Display */}
            {errorMessage && (
                <div className="p-3 text-sm font-semibold text-white bg-red-500 rounded-lg shadow-inner">
                    {errorMessage}
                </div>
            )}

            <form className="flex flex-col p-5 space-y-6 bg-white rounded-md shadow-lg" onSubmit={handleSubmit}>
                <label htmlFor="bio" className="flex flex-col space-y-2">
                    <span className="text-base font-medium text-gray-700">Bio</span>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        name="bio"
                        id="bio"
                        placeholder="Tell us a little about yourself..."
                        className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-theme-orange"
                        maxLength={500}
                    />
                </label>
                
                <div className="flex flex-col md:flex-row md:items-center md:space-x-5 space-y-3 md:space-y-0">
                    <label htmlFor="mediaType" className="flex flex-col">
                        <span className="text-base font-medium text-gray-700 mb-1">Avatar Source</span>
                        <select
                            className="py-2 px-4 bg-gray-50 border border-gray-300 rounded-md focus:ring-theme-orange focus:border-theme-orange"
                            name="mediaType"
                            id="mediaType"
                            value={mediaType}
                            onChange={(e) => setMediaType(e.target.value as "image" | "url")}>
                            <option value="image">Upload Image</option>
                            <option value="url">External URL</option>
                        </select>
                    </label>

                    {mediaType === "image" ? (
                        <div className="flex-1 w-full">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Image File</span>
                            <input
                                onChange={handleFileChange}
                                type="file"
                                name="file"
                                accept="image/*"
                                id="image"
                                className="w-full focus:outline-none file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-theme-cultured file:text-theme-orange hover:file:bg-gray-100"
                            />
                            {media && <p className="text-xs text-gray-500 mt-1">File ready: {media.name}</p>}
                        </div>
                    ) : (
                        <div className="flex-1 w-full">
                            <span className="text-sm font-medium text-gray-700 block mb-1">Image URL</span>
                            <input
                                type="url"
                                name="media_url"
                                id="media_url"
                                placeholder="https://example.com/avatar.jpg"
                                className="p-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-theme-orange"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                        </div>
                    )}
                </div >

                <p className="text-xs font-medium text-blue-600 p-2 border border-blue-200 bg-blue-50 rounded-md">
                    Note: If you submit a new image or URL, it will overwrite your current profile picture. Leave the field empty to keep your existing avatar.
                </p>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-3 font-semibold text-lg text-white rounded-lg bg-theme-orange hover:bg-orange-600 active:scale-[0.98] transition-all duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md">
                    {isSubmitting ? "Updating..." : "Save Profile"}
                </button>
            </form>
        </div>
    );
}

