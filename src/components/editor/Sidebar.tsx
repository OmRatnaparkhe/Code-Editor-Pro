import { useCodeStore } from "@/store/useStore"
import { FileCode, FileJson, FolderOpen, Plus, Pencil, Trash2 } from "lucide-react"
import { cn } from '@/lib/utils'
import { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const getFileIcon = (filename:string)=>{
    if(filename.endsWith('.js') || filename.endsWith('.ts')) return <FileCode className="w-4 h-4 text-yellow-400"/>
    if(filename.endsWith('.css')) return <FileCode className="w-4 h-4 text-blue-400"/>
    if(filename.endsWith('html')) return <FileCode className="w-4 h-4 text-orange-400"/>
    return <FileJson className="w-4 h-4 text-gray-400"/>
}

export default function Sidebar(){
    const { files, activeFile, setActiveFile, sidebarOpen, addFile, renameFile, deleteFile } = useCodeStore();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newFileName, setNewFileName] = useState("");
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameFileId, setRenameFileId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [error, setError] = useState<string | null>(null);

    const allowedExtText = useMemo(
        () => ".js, .ts, .py, .html, .css, .json, .java, .cpp, .cs, .php",
        []
    );

    if(!sidebarOpen) return null;
    
    const handleAddFile = () => {
        setError(null);
        const res = addFile(newFileName);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setNewFileName("");
        setIsAddOpen(false);
    };

    const openRename = (fileId: string, currentName: string) => {
        setError(null);
        setRenameFileId(fileId);
        setRenameValue(currentName);
        setIsRenameOpen(true);
    };

    const handleRename = () => {
        if (!renameFileId) return;
        setError(null);
        const res = renameFile(renameFileId, renameValue);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        setIsRenameOpen(false);
        setRenameFileId(null);
        setRenameValue("");
    };

    const handleDelete = (fileId: string) => {
        setError(null);
        const res = deleteFile(fileId);
        if (!res.ok) {
            setError(res.error);
        }
    };
    
    return (
        <div className="w-64 h-full bg-[#1e1e1e] text-gray-300 border-r border-[#2b2b2b] flex flex-col">
            <div className="p-4 font-bold text-sm tracking-wider flex items-center justify-between gap-2 border-b border-[#2b2b2b]">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4"/> EXPLORER
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="p-1 rounded hover:bg-[#2a2d2e] text-gray-300"
                            title="Add file"
                            onClick={() => {
                                setError(null);
                                setNewFileName("");
                            }}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#18181b] border-[#2b2b2b] text-white">
                        <DialogHeader>
                            <DialogTitle>Add File</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">File name</label>
                                <Input
                                    value={newFileName}
                                    onChange={(e) => setNewFileName(e.target.value)}
                                    placeholder={`e.g. utils.js (allowed: ${allowedExtText})`}
                                    className="bg-[#09090b] border-gray-700 text-white"
                                />
                            </div>

                            {error ? (
                                <div className="text-sm text-red-400">{error}</div>
                            ) : null}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                                    onClick={() => setIsAddOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={handleAddFile}
                                    disabled={!newFileName.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="bg-[#18181b] border-[#2b2b2b] text-white">
                    <DialogHeader>
                        <DialogTitle>Rename File</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">New file name</label>
                            <Input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                placeholder={`e.g. utils.js (allowed: ${allowedExtText})`}
                                className="bg-[#09090b] border-gray-700 text-white"
                            />
                        </div>

                        {error ? (
                            <div className="text-sm text-red-400">{error}</div>
                        ) : null}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                                onClick={() => setIsRenameOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={handleRename}
                                disabled={!renameValue.trim()}
                            >
                                Rename
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {error ? (
                <div className="px-4 pt-2 text-xs text-red-400">{error}</div>
            ) : null}
            <div className="flex-1 overflow-y-auto mt-2">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className={cn(
                            "group w-full px-2",
                            activeFile?.id === file.id && ""
                        )}
                    >
                        <div
                            onClick={() => setActiveFile(file)}
                            className={cn(
                                "w-full cursor-pointer text-left px-2 py-2 text-sm flex items-center gap-2 hover:bg-[#2a2d2e] transition-colors rounded",
                                activeFile?.id === file.id && "bg-[#37373d] text-white border-l-2 border-blue-500 rounded-l-none"
                            )}
                        >
                            {getFileIcon(file.name)}
                            <span className="flex-1 truncate">{file.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="p-1 rounded hover:bg-[#3a3a3a]"
                                    title="Rename"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openRename(file.id, file.name);
                                    }}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    className="p-1 rounded hover:bg-[#3a3a3a] text-red-300"
                                    title="Delete"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(file.id);
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}