"use client";

import { useMemo } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCodeStore } from "@/store/useStore";

const ROLES = ["host", "editor", "viewer"] as const;

type Role = (typeof ROLES)[number];

export default function ParticipantsDialog() {
  const isLive = useCodeStore((s) => s.isLive);
  const users = useCodeStore((s) => s.users);
  const myRole = useCodeStore((s) => s.myRole);
  const setUserRole = useCodeStore((s) => s.setUserRole);
  const socketId = useCodeStore((s) => s.socket?.id);

  const canManage = myRole === "host";

  const sortedUsers = useMemo(() => {
    const roleRank: Record<string, number> = { host: 0, editor: 1, viewer: 2 };
    return [...(users || [])].sort((a, b) => {
      const ra = roleRank[a.role || "viewer"] ?? 9;
      const rb = roleRank[b.role || "viewer"] ?? 9;
      if (ra !== rb) return ra - rb;
      return (a.username || "").localeCompare(b.username || "");
    });
  }, [users]);

  if (!isLive) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <Users className="w-4 h-4 mr-2" /> Participants
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#18181b] border-[#2b2b2b] text-white">
        <DialogHeader>
          <DialogTitle>Participants</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-gray-400">
            Your role: <span className="text-gray-200 font-mono">{myRole || "viewer"}</span>
          </div>

          <div className="divide-y divide-[#2b2b2b] rounded-md border border-[#2b2b2b]">
            {sortedUsers.map((u) => {
              const isMe = !!socketId && u.id === socketId;
              const currentRole = (u.role || "viewer") as Role;

              return (
                <div key={u.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-200 truncate">
                      {u.username}
                      {isMe ? <span className="text-xs text-gray-500"> (you)</span> : null}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{u.id}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManage && !isMe ? (
                      <select
                        className="bg-[#09090b] border border-gray-700 text-white text-xs rounded px-2 py-1"
                        value={currentRole}
                        onChange={(e) => setUserRole(u.id, e.target.value as Role)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-300 font-mono">
                        {currentRole}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {sortedUsers.length === 0 ? (
              <div className="px-3 py-3 text-sm text-gray-400">No users yet</div>
            ) : null}
          </div>

          {!canManage ? (
            <div className="text-xs text-gray-500">
              Only the <span className="text-gray-300 font-mono">host</span> can change roles.
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
