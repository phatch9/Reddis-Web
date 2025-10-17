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

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    seen boolean DEFAULT false NOT NULL,
    seen_at timestamp with time zone
);

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;

CREATE TABLE public.subthreads (
    id integer NOT NULL,
    name character varying(20) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    logo text,
    created_by integer
);

CREATE VIEW public.post_info AS
    SELECT t.id AS thread_id,
    t.name AS thread_name,
    t.logo AS thread_logo,
    p.id AS post_id,
    k.karma AS post_karma,
    p.title,
    p.media,
    p.is_edited,
    p.content,
    p.created_at,
    u.id AS user_id,
    u.username AS user_name,
    u.avatar AS user_avatar,
    c.comments_count

    FROM ((((public.posts p
    JOIN ( SELECT p_1.id AS post_id,
            COALESCE(sum(
                CASE
                    WHEN (r.is_upvote = true) THEN 1
                    WHEN (r.is_upvote = false) THEN '-1'::integer
                    ELSE 0
                END), (0)::bigint) AS karma
           FROM (public.posts p_1
             FULL JOIN public.reactions r ON ((r.post_id = p_1.id)))
          GROUP BY p_1.id) k ON ((k.post_id = p.id)))
     JOIN ( SELECT p_1.id AS post_id,
            count(c_1.id) AS comments_count
           FROM (public.posts p_1
             FULL JOIN public.comments c_1 ON ((c_1.post_id = p_1.id)))
          GROUP BY p_1.id) c ON ((c.post_id = p.id)))
     JOIN public.subthreads t ON ((t.id = p.subthread_id)))
     JOIN public.users u ON ((u.id = p.user_id)));

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;

CREATE SEQUENCE public.reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;