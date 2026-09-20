import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare, Send, Trash2, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { useLang } from "@/lib/i18n";
import { communityPostsQuery, communityRepliesQuery, profileQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  component: CommunityPage,
});

function timeAgo(iso: string, lang: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return lang === "hi" ? "अभी" : "just now";
  if (mins < 60) return lang === "hi" ? `${mins} मि पहले` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === "hi" ? `${hrs} घं पहले` : `${hrs}h ago`;
  return new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
}

function CommunityPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const uid = user?.id ?? null;
  const qc = useQueryClient();
  const posts = useQuery(communityPostsQuery);
  const replies = useQuery(communityRepliesQuery);
  const profile = useQuery(profileQuery);
  const [body, setBody] = useState("");
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const authorName = profile.data?.full_name ?? user?.email?.split("@")[0] ?? "Farmer";

  const addPost = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from("community_posts")
        .insert({ author_id: uid!, author_name: authorName, body: text });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      toast.success(lang === "hi" ? "पोस्ट साझा हुई" : "Post shared");
      qc.invalidateQueries({ queryKey: ["community_posts"] });
    },
    onError: () => toast.error(lang === "hi" ? "पोस्ट नहीं हो सकी" : "Could not post"),
  });

  const addReply = useMutation({
    mutationFn: async ({ postId, text }: { postId: string; text: string }) => {
      const { error } = await supabase
        .from("community_replies")
        .insert({ post_id: postId, author_id: uid!, author_name: authorName, body: text });
      if (error) throw error;
    },
    onSuccess: () => {
      setReplyFor(null);
      setReplyText("");
      qc.invalidateQueries({ queryKey: ["community_replies"] });
    },
  });

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community_posts"] }),
  });

  const repliesFor = (postId: string) => (replies.data ?? []).filter((r) => r.post_id === postId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageSquare className="h-6 w-6" /> {t("community")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("communityHint")}</p>
      </header>

      <div className="glass-card space-y-3 rounded-2xl p-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("newPost")}
          rows={3}
          aria-label={t("newPost")}
        />
        <Button
          disabled={!body.trim() || addPost.isPending}
          onClick={() => addPost.mutate(body.trim())}
        >
          {t("post")}
        </Button>
      </div>

      {(posts.data ?? []).length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{t("noPosts")}</p>
      )}

      <div className="space-y-4">
        {(posts.data ?? []).map((p) => (
          <article key={p.id} className="glass-card space-y-3 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <UserRound className="h-4 w-4" />
                {p.author_name ?? "Farmer"}
                <span className="font-normal text-muted-foreground">· {timeAgo(p.created_at, lang)}</span>
              </div>
              {p.author_id === uid && (
                <button
                  aria-label={t("delete")}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deletePost.mutate(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="whitespace-pre-wrap text-sm">{p.body}</p>

            <div className="space-y-2 border-t pt-2">
              {repliesFor(p.id).map((r) => (
                <div key={r.id} className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-semibold">{r.author_name ?? "Farmer"}</span>
                  <span className="text-muted-foreground"> · {timeAgo(r.created_at, lang)}</span>
                  <p className="whitespace-pre-wrap">{r.body}</p>
                </div>
              ))}
              {replyFor === p.id ? (
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (replyText.trim()) addReply.mutate({ postId: p.id, text: replyText.trim() });
                  }}
                >
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={1}
                    className="min-h-0"
                    aria-label={t("reply")}
                  />
                  <Button size="sm" type="submit" disabled={!replyText.trim() || addReply.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => { setReplyFor(p.id); setReplyText(""); }}>
                  {t("reply")} ({repliesFor(p.id).length})
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
