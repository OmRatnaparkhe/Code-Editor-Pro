import {create} from "zustand"
import { io, Socket} from "socket.io-client"

interface File {
    id: string,
    name: string,
    language: string,
    content: string
}

interface User {
    id:string;
    username:string;
    role?: string;
}

interface CodeStore{
    files: File[];
    isLive: boolean;
    projectId: string | null;
    roomId: string | null;
    socket: Socket | null;
    users: User[];
    myRole: string | null;
    activeFile: File | null;
    isRunning: boolean;
    output: { isError:boolean, message:string }|null;
    sidebarOpen: boolean;
    setActiveFile: (file:File)=>void;
    setProjectId: (id:string) => void;
    saveProject: () => Promise<void>;
    toggleSidebar: ()=>void;
    runCode: () => Promise<void>;
    updateFileContent: (id:string, newContent:string)=>void;
    addFile: (name: string) => { ok: true } | { ok: false; error: string };
    renameFile: (id: string, newName: string) => { ok: true } | { ok: false; error: string };
    deleteFile: (id: string) => { ok: true } | { ok: false; error: string };
    joinRoom: (roomId:string, username:string) => void;
    leaveRoom: () => void;
    setUserRole: (targetSocketId: string, role: "host" | "editor" | "viewer") => void;
}

const LANGUAGE_VERSIONS: Record<string, string> = {
  javascript: "18.15.0",
  typescript: "5.0.3",
  python: "3.10.0",
  java: "15.0.2",
  csharp: "6.12.0",
  php: "8.2.3",
}

const ws_url = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "https://code-editor-ws-l151.onrender.com";

export const useCodeStore = create<CodeStore>((set,get)=>({
    files:[],
    activeFile:null,
    sidebarOpen:true,
    isRunning:false,
    output:null,
    projectId:null,
    setProjectId:(id) => set({ projectId: id}),
    setActiveFile:(file)=> set({activeFile:file}),
    toggleSidebar:()=>set((state)=>({sidebarOpen:!state.sidebarOpen})),
    updateFileContent: (id, newContent) => {
        const state = get();
        const updatedFiles = state.files.map((f) => (f.id === id ? {...f, content: newContent} : f));
        const updatedActiveFile = state.activeFile?.id === id ? {...state.activeFile, content: newContent} : state.activeFile;
        
        if (state.socket && state.isLive && state.myRole !== "viewer") {
            state.socket.emit("file-change", {
                roomId: state.roomId,
                fileId: id,
                content: newContent
            });
        }
        
        set({ files: updatedFiles, activeFile: updatedActiveFile });
    },

    setUserRole: (targetSocketId, role) => {
        const state = get();
        if (!state.socket || !state.isLive || !state.roomId) return;
        state.socket.emit("set-role", {
            roomId: state.roomId,
            targetSocketId,
            role,
        });
    },

    addFile: (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: "File name is required" };

        const stateForRole = get();
        if (stateForRole.isLive && stateForRole.myRole === "viewer") {
            return { ok: false, error: "You do not have permission to add files" };
        }

        const lower = trimmed.toLowerCase();
        const allowed: Record<string, string> = {
            ".js": "javascript",
            ".ts": "typescript",
            ".py": "python",
            ".html": "html",
            ".css": "css",
            ".json": "json",
            ".java": "java",
            ".cpp": "cpp",
            ".cs": "csharp",
            ".php": "php",
        };

        const ext = Object.keys(allowed).find((e) => lower.endsWith(e));
        if (!ext) {
            return { ok: false, error: "Unsupported extension" };
        }

        const state = get();
        const exists = state.files.some((f) => f.name.toLowerCase() === lower);
        if (exists) return { ok: false, error: "A file with this name already exists" };

        const id = (globalThis.crypto && "randomUUID" in globalThis.crypto)
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const language = allowed[ext];
        const content = language === "python"
            ? ""
            : language === "html"
            ? ""
            : language === "css"
            ? ""
            : language === "json"
            ? "{}"
            : "";

        const newFile: File = { id, name: trimmed, language, content };
        set({ files: [...state.files, newFile], activeFile: newFile });

        const nextState = get();
        if (nextState.socket && nextState.isLive && nextState.roomId) {
            nextState.socket.emit("file-create", {
                roomId: nextState.roomId,
                file: newFile,
            });
        }
        return { ok: true };
    },

    renameFile: (id: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed) return { ok: false, error: "File name is required" };

        const stateForRole = get();
        if (stateForRole.isLive && stateForRole.myRole === "viewer") {
            return { ok: false, error: "You do not have permission to rename files" };
        }

        const lower = trimmed.toLowerCase();
        const allowed: Record<string, string> = {
            ".js": "javascript",
            ".ts": "typescript",
            ".py": "python",
            ".html": "html",
            ".css": "css",
            ".json": "json",
            ".java": "java",
            ".cpp": "cpp",
            ".cs": "csharp",
            ".php": "php",
        };

        const ext = Object.keys(allowed).find((e) => lower.endsWith(e));
        if (!ext) {
            return { ok: false, error: "Unsupported extension" };
        }

        const state = get();
        const exists = state.files.some((f) => f.id !== id && f.name.toLowerCase() === lower);
        if (exists) return { ok: false, error: "A file with this name already exists" };

        const language = allowed[ext];
        const updatedFiles = state.files.map((f) =>
            f.id === id ? { ...f, name: trimmed, language } : f
        );
        const updatedActiveFile = state.activeFile?.id === id
            ? ({ ...state.activeFile, name: trimmed, language } as File)
            : state.activeFile;

        set({ files: updatedFiles, activeFile: updatedActiveFile });

        const nextState = get();
        if (nextState.socket && nextState.isLive && nextState.roomId) {
            nextState.socket.emit("file-rename", {
                roomId: nextState.roomId,
                fileId: id,
                newName: trimmed,
                language,
            });
        }
        return { ok: true };
    },

    deleteFile: (id: string) => {
        const state = get();
        if (state.isLive && state.myRole === "viewer") {
            return { ok: false, error: "You do not have permission to delete files" };
        }
        if (state.files.length <= 1) {
            return { ok: false, error: "You must have at least one file" };
        }

        const updatedFiles = state.files.filter((f) => f.id !== id);
        const updatedActiveFile = state.activeFile?.id === id
            ? (updatedFiles[0] || null)
            : state.activeFile;

        set({ files: updatedFiles, activeFile: updatedActiveFile });

        const nextState = get();
        if (nextState.socket && nextState.isLive && nextState.roomId) {
            nextState.socket.emit("file-delete", {
                roomId: nextState.roomId,
                fileId: id,
            });
        }
        return { ok: true };
    },
    
    runCode: async() => {
        const { activeFile } = get();
        if(!activeFile) return ;

        set({isRunning:true, output:null})
        try{
            const response = await fetch(`${ws_url}/api/run`,{
                method:"POST",
                headers:{"Content-type":"application/json"},
                body: JSON.stringify({
                    language: activeFile.language ,
                    version: LANGUAGE_VERSIONS[activeFile.language] || "18.15.0",
                    code: activeFile.content
                })
            })
            const data = await response.json();

            if(data.run.stderr){
                set({ output: { isError:true, message:data.run.stderr }})
            }
            else{
                set({ output: { isError:false, message:data.run.stdout }})
            }
        }
        catch(e){
            set({output:{isError:true, message:"Execution failed to reach server."}});
        }finally{
            set({isRunning:false});
        }
    },

    isLive: false,
    roomId: null,
    socket:null,
    users: [],
    myRole: null,

    joinRoom: (roomId:string, username:string) => {
        const existingSocket = get().socket;
        if (existingSocket) {
            existingSocket.disconnect();
        }

        const socket = io(ws_url);
        set({ isLive: true, roomId, socket });

        let hasReceivedContent = false;
        let requestAttempts = 0;
        let requestInterval: ReturnType<typeof setInterval> | null = null;

        const startRequestLoop = () => {
            if (requestInterval) return;
            requestInterval = setInterval(() => {
                const state = get();
                if (hasReceivedContent || (state.files && state.files.length > 0)) {
                    if (requestInterval) clearInterval(requestInterval);
                    requestInterval = null;
                    return;
                }
                if (requestAttempts >= 8) {
                    if (requestInterval) clearInterval(requestInterval);
                    requestInterval = null;
                    return;
                }
                requestAttempts += 1;
                socket.emit("request-content", { roomId });
            }, 500);
        };

        socket.on("connect", () => {
            console.log("Connected to socket server");

            (async () => {
                try {
                    const res = await fetch(`${ws_url}/api/user-info`);
                    if (!res.ok) throw new Error("Failed to fetch user info");
                    const data = await res.json();

                    const clerkId = data?.id as string | undefined;
                    const email = data?.emailAddresses?.[0]?.emailAddress as string | undefined;

                    socket.emit("join-room", {
                        roomId,
                        username,
                        clerkId,
                        email,
                    });
                } catch (e) {
                    console.warn("Falling back to anonymous join-room", e);
                    socket.emit("join-room", roomId, username);
                }

                socket.emit("request-content", { roomId });
                startRequestLoop();
            })();
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        socket.on("user-joined",(users)=>{
            console.log("User joined room:", users);
            const myId = get().socket?.id;
            const me = myId ? users?.find((u: User) => u.id === myId) : undefined;
            set({ users, myRole: me?.role || null });
        });

        socket.on("user-left",(users)=>{
            console.log("User left room:", users);
            const myId = get().socket?.id;
            const me = myId ? users?.find((u: User) => u.id === myId) : undefined;
            set({ users, myRole: me?.role || get().myRole || null });
        });

        socket.on("permission-denied", ({ action }) => {
            console.error(`Permission denied for action: ${action}`);
        });

        socket.on("file-change", (data) => {
            console.log("Received file change:", data);
            const { fileId, content } = data;
            const { files, activeFile } = get();
            if (files && files.length > 0) {
                const updatedFiles = files.map(file =>
                    file.id === fileId ? { ...file, content } : file
                );
                const updatedActiveFile = activeFile?.id === fileId
                    ? ({ ...activeFile, content } as File)
                    : activeFile;
                set({ files: updatedFiles, activeFile: updatedActiveFile });
            }
        });

        socket.on("file-create", ({ file }) => {
            const state = get();
            if (state.files.some((f) => f.id === file.id)) return;
            set({ files: [...state.files, file], activeFile: state.activeFile || file });
        });

        socket.on("file-rename", ({ fileId, newName, language }) => {
            const state = get();
            const updatedFiles = state.files.map((f) =>
                f.id === fileId ? { ...f, name: newName, language: language || f.language } : f
            );
            const updatedActiveFile =
                state.activeFile && state.activeFile.id === fileId
                    ? ({
                        ...state.activeFile,
                        name: newName,
                        language: language || state.activeFile.language,
                    } as File)
                    : state.activeFile;
            set({ files: updatedFiles, activeFile: updatedActiveFile });
        });

        socket.on("file-delete", ({ fileId }) => {
            const state = get();
            if (state.files.length <= 1) return;
            const updatedFiles = state.files.filter((f) => f.id !== fileId);
            const updatedActiveFile = state.activeFile?.id === fileId
                ? (updatedFiles[0] || null)
                : state.activeFile;
            set({ files: updatedFiles, activeFile: updatedActiveFile });
        });

        socket.on("room-content", (data) => {
            console.log("Received room content:", data);
            const { files, activeFileId } = data;
            if (files && files.length > 0) {
                hasReceivedContent = true;
                if (requestInterval) clearInterval(requestInterval);
                requestInterval = null;
                const activeFile = files.find((f: File) => f.id === activeFileId) || files[0];
                set({ files, activeFile });
            }
        });

        socket.on("request-content", ({ requesterId }) => {
            console.log("Content requested by:", requesterId);
            const { files } = get();
            const currentRoomId = get().roomId;
            const role = get().myRole;
            if (role !== "host" && role !== "editor") return;
            if (currentRoomId && files && files.length > 0) {
                socket.emit("room-content", {
                    roomId: currentRoomId,
                    files,
                    activeFileId: (get().activeFile?.id || files[0].id)
                });
            }
        });

        socket.on("disconnect", () => {
            if (requestInterval) clearInterval(requestInterval);
            requestInterval = null;
        });
    },

    leaveRoom: () => {
        const {socket, roomId} = get();
        if(socket) {
            console.log("Disconnecting from room:", roomId);
            socket.emit("leave-room", roomId);
            socket.disconnect();
            set({ isLive: false, roomId: null, users: [], myRole: null, socket: null });
        } else {
            console.log("No socket connection found");
        }
    },

    saveProject: async() =>{
        const {projectId, files} = get();
        if(!projectId){
            console.error("No project selected");
            return;
        }
        try{
            const response = await fetch(`${ws_url}/api/projects/${projectId}`,{
            method:"PUT",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify({files})
        });

        if(!response.ok) throw new Error("Failed to save");
        console.log("Project saved successfully");
        }
        catch(e){
            console.error(e);
        }
        
    }
}));