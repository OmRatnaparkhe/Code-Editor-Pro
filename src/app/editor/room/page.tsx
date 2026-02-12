"use client";
import CodeEditor from "src/components/editor/CodeEditor";
import OutputPanel from "src/components/editor/OutputPanel";
import Sidebar from "src/components/editor/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { useCodeStore } from "src/store/useStore";
import { Copy, Loader2, PanelLeft, Play, LogOut, Check, Save } from "lucide-react";
import ParticipantsDialog from "src/components/editor/ParticipantsDialog";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function RoomPage() {
  const ws_url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "https://code-editor-ws-l151.onrender.com";
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const username = searchParams.get('username') || 'Guest';
  const router = useRouter();

  const { files, toggleSidebar, runCode, isRunning, setProjectId } = useCodeStore();
  const { joinRoom, leaveRoom, isLive, users } = useCodeStore();
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  useEffect(() => {
    if (!isLive && roomId) {
      joinRoom(roomId, username);

      setTimeout(() => {
        const currentState = useCodeStore.getState();
        if (!currentState.files || currentState.files.length === 0) {
          const defaultFile = {
            id: 'collab-1',
            name: 'main.js',
            language: 'javascript',
            content: `// Welcome to Room: ${roomId}
// Collaborative coding session started by ${username}

console.log("Hello from room ${roomId}!");

// Start coding together! 👥
`
          };

          useCodeStore.setState({
            files: [defaultFile],
            activeFile: defaultFile
          });
        }
      }, 3000);
    }
  }, [roomId, username, isLive, joinRoom]);

  const copyRoomId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    console.log('Leaving room...', { roomId, isLive, users });
    leaveRoom();

    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 1000);
  };

  const saveProject = async () => {
    const currentFiles = useCodeStore.getState().files;
    if (!currentFiles || currentFiles.length === 0) return;
    if (!projectName.trim()) return;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const inferredLanguage = currentFiles[0]?.language || "javascript";
      const createRes = await fetch(`${ws_url}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), language: inferredLanguage }),
      });

      if (!createRes.ok) {
        const err = await createRes.text().catch(() => "");
        throw new Error(err || `Failed to create project: ${createRes.status}`);
      }

      const createdProject = await createRes.json();
      const newProjectId = createdProject.id as string;

      const saveRes = await fetch(`${ws_url}/api/projects/${newProjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replace: true,
          files: currentFiles.map((f) => ({
            name: f.name,
            content: f.content,
            language: f.language,
          })),
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.text().catch(() => "");
        throw new Error(err || `Failed to save project: ${saveRes.status}`);
      }

      setSaveStatus('saved');
      setIsSaveModalOpen(false);
      setProjectName("");
      leaveRoom();
      setProjectId(newProjectId);
      router.push(`/editor/${newProjectId}`);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#1e1e1e] text-white flex flex-col overflow-hidden">
      <header className="h-12 border-b border-[#2b2b2b] flex items-center px-4 justify-between bg-[#18181b]">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-1 hover:bg-[#2b2b2b] rounded">
            <PanelLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="font-semibold text-sm">
            Room: {roomId}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Run Code"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunning ? "Running..." : "Run"}
          </button>

          <Dialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
            <DialogTrigger asChild>
              <button
                disabled={isSaving || !files || files.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Save as Project"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Saving..." : saveStatus === 'saved' ? "Saved" : "Save"}
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#18181b] border-[#2b2b2b] text-white">
              <DialogHeader>
                <DialogTitle>Save Room as Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="bg-[#09090b] border-gray-700 text-white"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                    onClick={() => setIsSaveModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={saveProject}
                    disabled={isSaving || !projectName.trim() || !files || files.length === 0}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isLive ? (
            <div className="flex items-center gap-2 bg-[#2b2b2b] px-3 py-1.5 rounded-md border border-green-900/50">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-400 font-mono">LIVE</span>
              <span className="text-xs text-gray-400 ml-2">Users: {users?.length || 0}</span>
              <ParticipantsDialog />
              <button onClick={copyRoomId} className="ml-2 hover:text-white transition-colors" title="Copy Room ID">
                {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <button onClick={handleLeaveRoom} className="ml-2 hover:text-red-400 transition-colors" title="Disconnect">
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#2b2b2b] px-3 py-1.5 rounded-md border border-blue-900/50">
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-xs text-blue-400 font-mono">JOINING ROOM...</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          <div className="flex-1 min-h-0">
            <CodeEditor />
          </div>

          <div className="h-[35%] min-h-[200px]">
            <OutputPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
