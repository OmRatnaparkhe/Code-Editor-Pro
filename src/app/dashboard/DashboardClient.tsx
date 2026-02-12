"use client";

import { Clock, Code2, Plus, Loader2, FileText,  MoreVertical, Users } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "src/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";

const languages = [
  { value: "javascript", label: "JavaScript", icon: "🟨", color: "bg-yellow-500" },
  { value: "typescript", label: "TypeScript", icon: "🔷", color: "bg-blue-500" },
  { value: "python", label: "Python", icon: "🐍", color: "bg-green-500" },
  { value: "java", label: "Java", icon: "☕", color: "bg-orange-500" },
  { value: "cpp", label: "C++", icon: "⚙️", color: "bg-purple-500" },
  { value: "html", label: "HTML", icon: "🌐", color: "bg-pink-500" },
  { value: "css", label: "CSS", icon: "🎨", color: "bg-cyan-500" },
  { value: "json", label: "JSON", icon: "📄", color: "bg-gray-500" },
];

const getLanguageInfo = (lang: string) => {
  return languages.find(l => l.value === lang) || languages[0];
};

interface Props {
  projects: any[];
}

export default function DashboardClient({ projects }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
  const [roomProjectName, setRoomProjectName] = useState("");
  const [roomLanguage, setRoomLanguage] = useState("javascript");
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createProject = async () => {
    if (!projectName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: projectName.trim(),
          language: selectedLanguage 
        }),
      });

      const project = await res.json();
      setIsModalOpen(false);
      setProjectName("");
      setSelectedLanguage("javascript");
      router.push(`/editor/${project.id}`);
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameProject = async (projectId: string, currentName: string) => {
    const newName = prompt("Enter new project name:", currentName);
    if (!newName || newName.trim() === "") return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      
      if (res.ok) {
        router.refresh(); 
      }
    } catch (error) {
      console.error("Error renaming project:", error);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        router.refresh(); 
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const createRoomProject = async () => {
    if (!roomProjectName.trim()) return;
    
    setIsCreatingRoom(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: roomProjectName.trim(),
          language: roomLanguage 
        }),
      });

      const project = await res.json();
      setIsCreateRoomModalOpen(false);
      setRoomProjectName("");
      setRoomLanguage(selectedLanguage);
      
      router.push(`/editor/${project.id}?createRoom=true`);
    } catch (error) {
      console.error("Error creating room project:", error);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const joinRoom = () => {
    if (!roomId.trim() || !username.trim()) return;
    
    router.push(`/editor/room?roomId=${roomId}&username=${username}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      
      <nav className="border-b border-gray-800 px-8 py-4 flex justify-between items-center bg-[#09090b]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">CodeMaster</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </nav>
      

      <main className="max-w-7xl mx-auto p-8">
        
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-white">
                My Projects
              </h1>
              
              <p className="text-gray-400">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} • Create and manage your code
              </p>
              
            </div>

            <div className="flex gap-3">
              <Dialog open={isCreateRoomModalOpen} onOpenChange={setIsCreateRoomModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-all">
                    <Users className="w-4 h-4" /> Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#18181b] border-gray-800 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Collaboration Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Project Name
                      </label>
                      <Input
                        value={roomProjectName}
                        onChange={(e) => setRoomProjectName(e.target.value)}
                        placeholder="Enter room project name..."
                        className="bg-[#09090b] border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {languages.map((lang) => (
                          <button
                            key={lang.value}
                            onClick={() => setRoomLanguage(lang.value)}
                            className={`p-3 rounded-lg border transition-all ${
                              roomLanguage === lang.value
                                ? "border-green-500 bg-green-500/10 text-green-400"
                                : "border-gray-700 text-gray-400 hover:border-gray-600"
                            }`}
                          >
                            <div className="text-lg mb-1">{lang.icon}</div>
                            <div className="text-xs">{lang.label}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setIsCreateRoomModalOpen(false)}
                        variant="outline"
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={createRoomProject}
                        disabled={!roomProjectName.trim() || isCreatingRoom}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingRoom ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Users className="w-4 h-4 mr-2" />
                            Create Room
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isJoinRoomModalOpen} onOpenChange={setIsJoinRoomModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 px-4 py-3 rounded-lg flex items-center gap-2 font-medium">
                    <Users className="w-4 h-4" /> Join Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#18181b] border-gray-800 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Join Collaboration Room</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Room ID
                      </label>
                      <Input
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Enter room ID..."
                        className="bg-[#09090b] border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name
                      </label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name..."
                        className="bg-[#09090b] border-gray-700 text-white"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => setIsJoinRoomModalOpen(false)}
                        variant="outline"
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={joinRoom}
                        disabled={!roomId.trim() || !username.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Join Room
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg flex items-center gap-2 font-medium transition-all">
                    <Plus className="w-4 h-4" /> New Project
                  </Button>
                </DialogTrigger>
              <DialogContent className="bg-[#18181b] border-gray-800 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Project Name</label>
                    <Input
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Awesome Project"
                      className="bg-[#09090b] border-gray-700 text-white placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Language</label>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => setSelectedLanguage(lang.value)}
                          className={`p-3 rounded-lg border transition-all text-left ${
                            selectedLanguage === lang.value
                              ? "border-blue-500 bg-blue-500/10 text-blue-400"
                              : "border-gray-700 hover:border-gray-600 text-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-lg">{lang.icon}</span>
                            <span className="text-sm font-medium">{lang.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 border-gray-700 hover:bg-gray-800 text-gray-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={createProject}
                      disabled={!projectName.trim() || isCreating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create Project"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative max-w-md">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="bg-[#18181b] border-gray-700 text-white placeholder-gray-500 pl-10"
          />
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>

        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => {
              const langInfo = getLanguageInfo(project.files?.[0]?.language || 'javascript');
              return (
                <div key={project.id} className="group block">
                  <Link
                    href={`/editor/${project.id}`}
                    className="block"
                  >
                    <div className="bg-[#18181b] border border-gray-800 rounded-xl p-6 hover:border-blue-500 transition-all duration-300 h-full">
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 ${langInfo.color} rounded-lg flex items-center justify-center text-lg font-bold`}>
                          {langInfo.icon}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              className="p-1 hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#18181b] border-gray-800">
                            <DropdownMenuItem 
                              className="text-gray-300 hover:text-white hover:bg-gray-700"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRenameProject(project.id, project.name);
                              }}
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {project.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                          <span className="px-2 py-1 bg-gray-800 rounded-md text-xs">
                            {langInfo.label}
                          </span>
                          <span>•</span>
                          <span>{project.files?.length || 0} files</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(project.updatedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-300">
                {searchTerm ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first project to get started with CodeMaster'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
