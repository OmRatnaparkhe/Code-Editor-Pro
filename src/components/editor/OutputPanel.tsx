import { useCodeStore } from "@/store/useStore";
import { AlertCircle, Loader2, Terminal } from "lucide-react";
import {cn} from "@/lib/utils"

export default function OutputPanel(){
    const {output, isRunning} = useCodeStore();

    return (
        <div className="h-full bg-[#1e1e1e] border-t border-[#2b2b2b] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-[#2b2b2b]">
                <div className="flex items-center gap-2 text-gray-400">
                    <Terminal className="w-4 h-4"/>
                    <span className="text-xs font-semibold uppercase tracking-wider">Output / Console</span>
                </div>
            </div>

            <div className="flex-1 p-4 font-mono text-sm overflow-auto">
                {isRunning ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin"/>
                        <span>Running code...</span>
                    </div>
                ) : output? (
                    <div className={cn("whitespace-pre-wrap", output.isError ? "text-red-400":"text-gray-300")}>
                        {output.isError &&  <AlertCircle className="w-4 h-4 inline mr-2 mb-1"/>}
                        {output.message || <span className="text-gray-600">Program finished with no output.</span>}
                    </div>
                ) : (
                    <div className="text-gray-600 italic">
                        Run your code to see the output here...
                    </div>
                )}
            </div>
        </div>
    );
}