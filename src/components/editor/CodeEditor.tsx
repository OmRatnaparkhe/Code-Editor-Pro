
import { useCodeStore } from "src/store/useStore";
import { Editor, OnMount } from "@monaco-editor/react";
import { useEffect, useRef } from "react";

export default function CodeEditor(){
    const{activeFile, updateFileContent, roomId, socket, saveProject, myRole} = useCodeStore();
    const editorRef = useRef<any>(null);
    const isApplyingRemoteRef = useRef(false);

    const handleEditorDidMount : OnMount = (editor, monaco)=>{
        editorRef.current = editor;
    }

    useEffect(()=>{
        if(!socket || !editorRef.current) return;
        const handleRemoteUpdate = (newCode : string)=>{
            const currentCode = editorRef.current.getValue();
            if(newCode !== currentCode){
                isApplyingRemoteRef.current = true;
                const position = editorRef.current.getPosition();
                editorRef.current.setValue(newCode);
                editorRef.current.setPosition(position);
                queueMicrotask(() => {
                    isApplyingRemoteRef.current = false;
                });
            }
        };

        socket.on("code-update", handleRemoteUpdate);

        return () => {
            socket.off("code-update", handleRemoteUpdate);
        }
        
    },[ socket ])

    useEffect(()=>{
        const handleKeyDown = (e: KeyboardEvent) =>{
            if((e.ctrlKey || e.metaKey) && e.key === 's'){
                e.preventDefault();
                saveProject();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown',handleKeyDown);
    },[])

    const handleEditorChange = (value : string | undefined) => {
        if(!value) return ;
        if (myRole === "viewer") return;
        if (isApplyingRemoteRef.current) return;
        updateFileContent(activeFile?.id!, value);

        if(socket && roomId){
            socket.emit("code-change",{roomId, code:value});
        }
    };

    if(!activeFile) return <div className="flex items-center justify-center h-full text-gray-500">Select a file</div>
    
    return (
        <div className="h-full w-full overflow-hidden">
            <div className="h-10 bg-[#1e1e1e] flex items-center border-b border-[#2b2b2b]">
                <div className="px-4 py-2 bg-[#1e1e1e] text-sm text-white border-t-2 border-blue-500 flex items-center gap-2">
                    {activeFile.name}
                </div>
            </div>

            <Editor
            height="calc(100vh - 40px)"
            theme="vs-dark"
            path={activeFile.name}
            language={activeFile.language}
            defaultValue={activeFile.content}
            value={activeFile.content}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
                minimap:{enabled:false},
                fontSize:14,
                scrollBeyondLastLine:false,
                automaticLayout:true,
                padding: {top:16},
                readOnly: myRole === "viewer",
            }}
            />
        </div>
    );
}