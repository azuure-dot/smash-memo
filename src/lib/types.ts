import type { JSONContent } from "@tiptap/react";

export type Game = "ultimate" | "melee" | "roa2";
export type StageStatus = "neutral" | "prefer" | "avoid";

export type Matchup = {
  id: string;
  user_id: string;
  game: Game;
  my_character: string;
  opponent_character: string;
  content: JSONContent | null;
  is_shared: boolean;
  /** Set when this note was duplicated from someone else's shared note. */
  copied_from: string | null;
  created_at: string;
  updated_at: string;
};

/** A YouTube video attached to a matchup note (only the video id is stored). */
export type MatchupVideo = {
  id: string;
  matchup_id: string;
  video_id: string;
  title: string | null;
  start_seconds: number | null;
  created_at: string;
};

/** Public part of a user's profile, shown as the author of shared notes. */
export type Profile = {
  username: string | null;
  avatar_url: string | null;
};

/** A note opened through its share link (shape returned by the get_shared_matchup() SQL function). */
export type SharedMatchup = {
  matchup: Pick<Matchup, "id" | "game" | "my_character" | "opponent_character" | "content" | "updated_at">;
  author: Profile;
  is_owner: boolean;
  is_saved: boolean;
  stages: MatchupStage[];
  quick_notes: QuickNote[];
  /** Missing until migration 0008 has been run. */
  videos?: MatchupVideo[];
};

/** A row of the "Saved Notes" tab (list_saved_matchups()). */
export type SavedMatchup = Pick<Matchup, "id" | "game" | "my_character" | "opponent_character" | "updated_at"> & {
  saved_at: string;
};

export type MatchupStage = {
  id: string;
  matchup_id: string;
  name: string;
  status: StageStatus;
  is_custom: boolean;
  position: number;
};

export type QuickNote = {
  id: string;
  matchup_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};
