CREATE TABLE public.comments (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    parent_id integer,
    has_parent boolean,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_edited boolean DEFAULT false
);


CREATE TABLE public.posts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subthread_id integer NOT NULL,
    title text NOT NULL,
    media text,
    content text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_edited boolean DEFAULT false
);


CREATE TABLE public.reactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer,
    comment_id integer,
    is_upvote boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    email text NOT NULL,
    avatar text,
    bio text,
    registration_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


CREATE VIEW public.comment_info AS
    SELECT c.id AS comment_id,
    u.username AS user_name,
    u.avatar AS user_avatar,
    ckarma.comment_karma,
    c.has_parent,
    c.parent_id,
    c.is_edited,
    c.content,
    c.created_at,
    p.id AS post_id
FROM (((public.posts p FULL JOIN public.comments c ON ((c.post_id = p.id)))
    FULL JOIN ( SELECT c_1.id AS comment_id,
        COALESCE(sum(
            CASE
                WHEN (r.is_upvote = true) THEN 1
                WHEN (r.is_upvote = false) THEN '-1'::integer
                ELSE 0
            END), (0)::bigint) AS comment_karma
        FROM (public.comments c_1
            FULL JOIN public.reactions r ON ((r.comment_id = c_1.id)))
        GROUP BY c_1.id
        HAVING (c_1.id IS NOT NULL)) ckarma ON ((ckarma.comment_id = c.id)))
        FULL JOIN public.users u ON ((u.id = c.user_id)));

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;