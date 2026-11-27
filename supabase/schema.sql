-- Volta: database schema (Supabase / PostgreSQL)
-- Exported from the production project. Run it once in the Supabase SQL Editor of a new project.
-- Order: tables -> keys -> indexes -> RLS -> functions -> triggers -> policies.
-- Storage: also create a PUBLIC bucket named `post-media` (Storage -> New bucket).

create extension if not exists "uuid-ossp";

-- ===== Tables =====

create table public.comments (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  post_id uuid not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table public.countries_visited (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  country_code text not null,
  country_name text not null,
  visited_at date,
  created_at timestamp with time zone default now()
);

create table public.follows (
  id uuid not null default uuid_generate_v4(),
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.likes (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone default now()
);

create table public.notifications (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid not null,
  type text not null,
  post_id uuid,
  read boolean default false,
  created_at timestamp with time zone default now()
);

create table public.post_media (
  id uuid not null default uuid_generate_v4(),
  post_id uuid not null,
  url text not null,
  type text not null,
  "order" integer default 0,
  created_at timestamp with time zone default now()
);

create table public.post_views (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  post_id uuid not null,
  viewed_at timestamp with time zone default now()
);

create table public.posts (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null,
  country_code text not null,
  country_name text not null,
  title text not null,
  excerpt text,
  cover_image text,
  blocks jsonb default '[]'::jsonb,
  theme jsonb default '{}'::jsonb,
  music_url text,
  music_provider text,
  music_track_name text,
  published boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.profiles (
  id uuid not null,
  username text not null,
  display_name text,
  bio text,
  avatar_url text,
  location text,
  created_at timestamp with time zone default now(),
  is_private boolean default false,
  globe_color text,
  birthdate date
);

-- ===== Primary keys, unique and check constraints =====

alter table comments add constraint comments_pkey PRIMARY KEY (id);

alter table countries_visited add constraint countries_visited_pkey PRIMARY KEY (id);

alter table countries_visited add constraint countries_visited_user_id_country_code_key UNIQUE (user_id, country_code);

alter table follows add constraint follows_follower_id_following_id_key UNIQUE (follower_id, following_id);

alter table follows add constraint follows_pkey PRIMARY KEY (id);

alter table likes add constraint likes_pkey PRIMARY KEY (id);

alter table likes add constraint likes_user_id_post_id_key UNIQUE (user_id, post_id);

alter table notifications add constraint notifications_pkey PRIMARY KEY (id);

alter table notifications add constraint notifications_type_check CHECK ((type = ANY (ARRAY['like'::text, 'comment'::text, 'follow'::text])));

alter table post_media add constraint post_media_pkey PRIMARY KEY (id);

alter table post_views add constraint post_views_pkey PRIMARY KEY (id);

alter table post_views add constraint post_views_user_id_post_id_key UNIQUE (user_id, post_id);

alter table posts add constraint posts_pkey PRIMARY KEY (id);

alter table profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table profiles add constraint profiles_username_key UNIQUE (username);

-- ===== Foreign keys =====

alter table comments add constraint comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table comments add constraint comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table countries_visited add constraint countries_visited_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table follows add constraint follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table follows add constraint follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table likes add constraint likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table likes add constraint likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table notifications add constraint notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table notifications add constraint notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table post_media add constraint post_media_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table post_views add constraint post_views_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

alter table post_views add constraint post_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table posts add constraint posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===== Indexes =====

CREATE INDEX comments_post_id_idx ON public.comments USING btree (post_id);

CREATE INDEX countries_visited_country_code_idx ON public.countries_visited USING btree (country_code);

CREATE INDEX countries_visited_user_id_idx ON public.countries_visited USING btree (user_id);

CREATE INDEX follows_follower_following_idx ON public.follows USING btree (follower_id, following_id);

CREATE INDEX follows_follower_id_idx ON public.follows USING btree (follower_id);

CREATE INDEX follows_following_id_idx ON public.follows USING btree (following_id);

CREATE INDEX likes_post_id_idx ON public.likes USING btree (post_id);

CREATE INDEX likes_user_id_idx ON public.likes USING btree (user_id);

CREATE INDEX notifications_read_idx ON public.notifications USING btree (user_id, read);

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);

CREATE INDEX post_views_post_id_idx ON public.post_views USING btree (post_id);

CREATE INDEX post_views_user_created_idx ON public.post_views USING btree (user_id, viewed_at DESC);

CREATE INDEX post_views_user_id_idx ON public.post_views USING btree (user_id);

CREATE INDEX post_views_user_post_idx ON public.post_views USING btree (user_id, post_id);

CREATE INDEX posts_country_code_idx ON public.posts USING btree (country_code);

CREATE INDEX posts_published_created_idx ON public.posts USING btree (published, created_at DESC);

CREATE INDEX posts_published_idx ON public.posts USING btree (published);

CREATE INDEX posts_user_country_idx ON public.posts USING btree (user_id, country_code);

CREATE INDEX posts_user_id_idx ON public.posts USING btree (user_id);

CREATE INDEX posts_user_published_idx ON public.posts USING btree (user_id, published);

CREATE INDEX profiles_is_private_idx ON public.profiles USING btree (is_private);

CREATE INDEX profiles_username_idx ON public.profiles USING btree (username);

-- ===== Row Level Security =====

alter table public.comments enable row level security;

alter table public.countries_visited enable row level security;

alter table public.follows enable row level security;

alter table public.likes enable row level security;

alter table public.notifications enable row level security;

alter table public.post_media enable row level security;

alter table public.post_views enable row level security;

alter table public.posts enable row level security;

alter table public.profiles enable row level security;

-- ===== Functions (SECURITY DEFINER: run with owner privileges) =====

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE post_owner UUID;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_follow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.following_id != NEW.follower_id THEN
    INSERT INTO notifications (user_id, actor_id, type)
    VALUES (NEW.following_id, NEW.follower_id, 'follow');
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE post_owner UUID;
BEGIN
  SELECT user_id INTO post_owner FROM posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (post_owner, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$
;

-- ===== Triggers =====

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION notify_comment();

CREATE TRIGGER on_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION notify_follow();

CREATE TRIGGER on_like AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION notify_like();

-- ===== RLS policies =====

create policy "comentários visíveis se o post for visível" on public.comments as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM posts
  WHERE (posts.id = comments.post_id))));

create policy "user gere os seus comentários" on public.comments as PERMISSIVE for ALL to public using ((auth.uid() = user_id));

create policy "países visitados visíveis a todos" on public.countries_visited as PERMISSIVE for SELECT to public using (true);

create policy "user gere os seus países" on public.countries_visited as PERMISSIVE for ALL to public using ((auth.uid() = user_id));

create policy "follows visíveis a todos" on public.follows as PERMISSIVE for SELECT to public using (true);

create policy "user gere os seus follows" on public.follows as PERMISSIVE for ALL to public using ((auth.uid() = follower_id));

create policy "user pode remover os seus seguidores" on public.follows as PERMISSIVE for DELETE to public using ((auth.uid() = following_id));

create policy "likes visíveis se o post for visível" on public.likes as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM posts
  WHERE (posts.id = likes.post_id))));

create policy "user gere os seus likes" on public.likes as PERMISSIVE for ALL to public using ((auth.uid() = user_id));

create policy "Users see own notifications" on public.notifications as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));

create policy "Users update own" on public.notifications as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));

create policy "media de posts públicos visível a todos" on public.post_media as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM posts
  WHERE ((posts.id = post_media.post_id) AND ((posts.published = true) OR (auth.uid() = posts.user_id))))));

create policy "user gere a sua media" on public.post_media as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM posts
  WHERE ((posts.id = post_media.post_id) AND (auth.uid() = posts.user_id)))));

create policy "user gere os seus views" on public.post_views as PERMISSIVE for ALL to public using ((auth.uid() = user_id));

create policy "user vê os seus próprios views" on public.post_views as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));

create policy "posts visíveis conforme privacidade" on public.posts as PERMISSIVE for SELECT to public using (((auth.uid() = user_id) OR ((published = true) AND ((NOT (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = posts.user_id) AND p.is_private)))) OR (EXISTS ( SELECT 1
   FROM follows f
  WHERE ((f.following_id = posts.user_id) AND (f.follower_id = auth.uid()))))))));

create policy "user gere os seus posts" on public.posts as PERMISSIVE for ALL to public using ((auth.uid() = user_id));

create policy "perfis públicos visíveis a todos" on public.profiles as PERMISSIVE for SELECT to public using (true);

create policy "user edita o seu próprio perfil" on public.profiles as PERMISSIVE for ALL to public using ((auth.uid() = id));
