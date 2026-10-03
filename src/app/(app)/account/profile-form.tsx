"use client";

import { Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fieldClass, primaryButtonClass } from "@/components/auth-shell";
import { Avatar } from "@/components/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** Originals can be big phone photos: they're cropped and shrunk before upload (the bucket caps files at 2 MB). */
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const AVATAR_PX = 256;

/** Center-crops to a square and resizes to 256 px. WebP when the browser can encode it, PNG otherwise. */
async function toSquareAvatar(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_PX, AVATAR_PX);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob) throw new Error("Couldn't encode the image");
  return blob;
}

export function ProfileForm({ userId, initial }: { userId: string; initial: Profile }) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(initial.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [newAvatar, setNewAvatar] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Free the preview's object URL when it changes or the form unmounts.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shownUrl = preview ?? avatarUrl;
  const dirty =
    newAvatar !== null || avatarUrl !== initial.avatar_url || username.trim() !== (initial.username ?? "");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError(null);
    setSaved(false);
    if (!ACCEPTED.includes(file.type)) return setError("Use a JPEG, PNG or WebP image.");
    if (file.size > MAX_SOURCE_BYTES) return setError("That image is too large (10 MB max).");
    try {
      const blob = await toSquareAvatar(file);
      setNewAvatar(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError("Couldn't read that image. Try another one.");
    }
  }

  function removePhoto() {
    setNewAvatar(null);
    setPreview(null);
    setAvatarUrl(null);
    setSaved(false);
  }

  /** Deletes every file in the user's avatar folder except `keep` (everything if `keep` is undefined). */
  async function cleanUpFolder(keep?: string) {
    const { data } = await supabase.storage.from("avatars").list(userId);
    const stale = (data ?? []).map((f: { name: string }) => `${userId}/${f.name}`).filter((p: string) => p !== keep);
    if (stale.length) await supabase.storage.from("avatars").remove(stale);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (name && (name.length < 2 || name.length > 24)) return setError("Usernames are 2 to 24 characters.");
    setBusy(true);
    setError(null);
    setSaved(false);

    let url = avatarUrl;
    let uploadedPath: string | undefined;
    if (newAvatar) {
      const ext = newAvatar.type === "image/webp" ? "webp" : "png";
      uploadedPath = `${userId}/${Date.now()}.${ext}`; // new name each time: no stale browser cache
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(uploadedPath, newAvatar, { contentType: newAvatar.type, cacheControl: "31536000" });
      if (upErr) {
        setBusy(false);
        return setError("Couldn't upload the picture. Check your connection and try again.");
      }
      url = supabase.storage.from("avatars").getPublicUrl(uploadedPath).data.publicUrl;
    }

    const { error: dbErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, username: name || null, avatar_url: url });

    if (dbErr) {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      setBusy(false);
      return setError(dbErr.code === "23505" ? "That username is already taken." : "Couldn't save your profile.");
    }

    // Old pictures are no longer referenced anywhere: keep only the current one (if any).
    const currentPath = url?.split("/object/public/avatars/")[1];
    await cleanUpFolder(currentPath).catch(() => {});

    setAvatarUrl(url);
    setNewAvatar(null);
    setPreview(null);
    setBusy(false);
    setSaved(true);
    router.refresh(); // header avatar
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar url={shownUrl} name={username || "?"} className="size-20 text-2xl" />
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} onChange={pick} hidden />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-9 items-center gap-2 rounded-xl border border-brand-from/60 bg-brand-from/10 px-3 text-sm font-medium transition hover:bg-brand-from/20"
          >
            <Camera className="size-4 text-brand-from" />
            {shownUrl ? "Change photo" : "Upload photo"}
          </button>
          {shownUrl && (
            <button
              type="button"
              onClick={removePhoto}
              className="flex h-9 items-center gap-2 rounded-xl px-3 text-sm text-muted transition hover:bg-avoid/10 hover:text-avoid"
            >
              <Trash2 className="size-4" /> Remove
            </button>
          )}
          <p className="w-full text-[11px] text-muted">JPEG, PNG or WebP. Cropped to a square.</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Username</span>
        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSaved(false);
          }}
          maxLength={24}
          placeholder="e.g. PlayerName"
          autoComplete="nickname"
          className={fieldClass}
        />
        <span className="mt-1 block text-[11px] text-muted">Shown as the author on notes you share.</span>
      </label>

      {error && <p className="text-sm text-avoid" role="alert">{error}</p>}
      {saved && !dirty && <p className="text-sm text-success" role="status">Profile saved.</p>}

      <button type="submit" disabled={busy || !dirty} className={primaryButtonClass}>
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
