
"use client"
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
import { Copy, Loader2, PanelLeft, Play, Users, LogOut, Check, Save} from "lucide-react";
import ParticipantsDialog from "src/components/editor/ParticipantsDialog";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, use } from "react";
import { useSearchParams } from "next/navigation";

interface editorPageProps {
    params: Promise<{projectId:string}>
}

export default function EditorPage({params}:editorPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;
  const searchParams = useSearchParams();
  const createRoom = searchParams.get('createRoom') === 'true';
  
  const { setActiveFile, files, toggleSidebar, runCode, isRunning, setProjectId } = useCodeStore();
  const { joinRoom, leaveRoom, isLive, roomId, users } = useCodeStore();
  const router = useRouter();
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [username, setUsername] = useState("");
  const hasEmittedInitialSnapshotRef = useRef(false);

  useEffect(() => {
    if (!isLive || !roomId) return;
    if (!files || files.length === 0) return;
    if (hasEmittedInitialSnapshotRef.current) return;

    const socket = useCodeStore.getState().socket;
    if (!socket) return;

    const emitSnapshotOnce = () => {
      if (hasEmittedInitialSnapshotRef.current) return;
      hasEmittedInitialSnapshotRef.current = true;
      socket.emit("room-content", {
        roomId,
        files,
        activeFileId: useCodeStore.getState().activeFile?.id || files[0].id,
      });
    };

    if (socket.connected) {
      emitSnapshotOnce();
      return;
    }

    socket.once("connect", emitSnapshotOnce);
    return () => {
      socket.off("connect", emitSnapshotOnce);
    };
  }, [isLive, roomId, files]);

  useEffect(() => {
    if (!isLive) {
      hasEmittedInitialSnapshotRef.current = false;
    }
  }, [isLive]);

  useEffect(() => {
  const loadProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch project: ${res.status}`);
      }
      
      const project = await res.json();
      if (project.files?.length) {
        useCodeStore.setState({ files: project.files });
        useCodeStore.setState({ activeFile: project.files[0] });
      }
    } catch (error) {
      console.error("Error loading project:", error);
    }
  };

  loadProject();
}, [projectId]);
  
  useEffect(()=>{
    setProjectId(projectId)
  },[projectId, setProjectId]);

  useEffect(() => {
    if (createRoom && projectId && !isLive) {
      const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const getUsername = async () => {
        try {
          const res = await fetch('/api/user-info');
          const data = await res.json();
          const userName = data.firstName || data.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Host';
          setUsername(userName);
          
          joinRoom(generatedRoomId, userName);

          const newUrl = `/editor/${projectId}`;
          window.history.replaceState({},'',newUrl);
        } catch (error) {
          console.error('Error getting user info:', error);
          joinRoom(generatedRoomId, 'Host');
        }
      };
      
      getUsername();
    }
  }, [createRoom, projectId, isLive, joinRoom, files]);

  const copyRoomId = () => {
    if(!roomId) return;
    navigator.clipboard.writeText(roomId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false),2000);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    router.push("/dashboard");
  };

  const saveProject = async () => {
    if (!projectId) return;
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save project: ${res.status}`);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const startLiveSession = ()=>{
    const newRoomId = Math.random().toString(36).substring(7);
    joinRoom(newRoomId, "User-"+ Math.floor(Math.random()*1000));
    alert(`Session Live! Share this Id:${newRoomId}`)
  }
  useEffect(()=>{
    if(files.length > 0){
      setActiveFile(files[0])
    }
  },[]);

  return (
    <div className="h-screen w-full bg-[#1e1e1e] text-white flex flex-col overflow-hidden">
      <header className="h-12 border-b border-[#2b2b2b] flex items-center px-4 justify-between bg-[#18181b]">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-1 hover:bg-[#2b2b2b] rounded">
            <PanelLeft className="w-5 h-5 text-gray-400"/>
          </button>
          <h1 className="font-semibold text-sm">
            CodeMaster Pro
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isLive ? (
        <div className="flex items-center gap-2 bg-[#2b2b2b] px-3 py-1.5 rounded-md border border-green-900/50">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs text-green-400 font-mono">LIVE</span>
            <span className="text-xs text-gray-400 ml-2">Room: {roomId}</span>
            <span className="text-xs text-gray-400 ml-2">Users: {users?.length || 0}</span>
            <ParticipantsDialog />
            <button onClick={copyRoomId} className="ml-2 hover:text-white transition-colors" title="Copy Room ID">
                {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
            <button onClick={handleLeaveRoom} className="ml-2 hover:text-red-400 transition-colors" title="Disconnect">
                <LogOut className="w-3 h-3" />
            </button>
        </div>
    ) : createRoom ? (
        <div className="flex items-center gap-2 bg-[#2b2b2b] px-3 py-1.5 rounded-md border border-blue-900/50">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-xs text-blue-400 font-mono">CREATING ROOM...</span>
        </div>
    ) : (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Users className="w-4 h-4 mr-2" /> Collaborate
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#18181b] border-[#2b2b2b] text-white">
                <DialogHeader>
                    <DialogTitle>Real-time Collaboration</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-400">Start a new session</label>
                        <Button onClick={startLiveSession} className="w-full bg-blue-600 hover:bg-blue-700">
                            Create New Room
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[#2b2b2b]" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#18181b] px-2 text-gray-500">Or join existing</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-400">Enter Room ID</label>
                        <div className="flex gap-2">
                            <Input 
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value)}
                                placeholder="e.g. abc-123"
                                className="bg-[#2b2b2b] border-gray-700 text-white"
                            />
                            <Button 
                                onClick={() => joinRoom(joinRoomId, "Guest User")}
                                disabled={!joinRoomId}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Join
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )}
          <button 
            onClick={saveProject}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Save Project"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
            {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
          </button>
          <button 
          onClick={runCode}
          disabled={isRunning}
          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white px-5 py-2 rounded-md font-semibold flex items-center gap-2 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4 fill-current"/>}
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <div className="w-9 h-9 bg-blue-600 rounded-full ring-blue-500/20 flex items-center justify-center font-medium">U</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar/>
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          <div className="flex-1 min-h-0">
            <CodeEditor/>
          </div>

          <div className="h-[35%] min-h-[200px]">
            <OutputPanel/>
          </div>
        </main>
      </div>
    </div>
  );
}
