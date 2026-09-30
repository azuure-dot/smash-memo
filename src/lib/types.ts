import type { JSONContent } from "@tiptap/react";

export type Game = "ultimate" | "melee";
export type StageStatus = "neutral" | "prefer" | "avoid";

export type Matchup = {
  id: string;
  user_id: string;
  game: Game;
  my_character: string;
  opponent_character: string;
  content: JSONContent | null;
  created_at: string;
  updated_at: string;
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
