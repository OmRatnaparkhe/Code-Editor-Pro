import { Server } from "socket.io"
import { PrismaClient } from "@prisma/client"
import express from "express"
import cors from "cors"

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ["https://code-editor-pro-frxe.onrender.com", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
  console.log(`🚀 HTTP Server running on port ${port}`);
});

const io = new Server(server, {
  cors: {
    methods: ["GET", "POST"],
    origin: "https://code-editor-pro-frxe.onrender.com",
    credentials: true
  }
});

console.log("🚀 WebSocket Server running on port 4000");

const prisma = new PrismaClient();

const rooms = {};

const canMutateRoom = (role) => role === "host" || role === "editor";
const isHost = (role) => role === "host";

const normalizeRole = (role) => {
    if (role === "host" || role === "editor" || role === "viewer") return role;
    return null;
};

const emitRoomUsers = (roomId) => {
    io.to(roomId).emit("user-joined", rooms[roomId] || []);
};

// API Routes

// GET /api/projects
app.get('/api/projects', async (req, res) => {
  try {
    // For now, return empty array since we don't have auth in this server
    // You'll need to implement auth middleware here
    const projects = await prisma.project.findMany({
      include: { files: true },
      orderBy: { updatedAt: "desc" }
    });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/projects
app.post('/api/projects', async (req, res) => {
  try {
    const { name = "Untitled Project", language = "javascript" } = req.body;
    
    // For now, use a default user - you'll need to implement auth
    const user = await prisma.user.findFirst({
      where: { clerkId: "default-user" }
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const getDefaultContent = (lang) => {
      switch (lang) {
        case "python": return "print('Hello World')";
        case "java": return `public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}`;
        case "cpp": return `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World\" << endl;\n    return 0;\n}`;
        case "html": return `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>`;
        case "css": return `/* CSS Styles */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}`;
        case "typescript": return `// TypeScript Hello World\nconst message: string = \"Hello World\";\nconsole.log(message);`;
        case "json": return `{\n  \"message\": \"Hello World\",\n  \"version\": \"1.0.0\"\n}`;
        default: return "console.log('Hello World');";
      }
    };

    const getDefaultFileName = (lang) => {
      switch (lang) {
        case "python": return "main.py";
        case "java": return "Main.java";
        case "cpp": return "main.cpp";
        case "html": return "index.html";
        case "css": return "styles.css";
        case "typescript": return "main.ts";
        case "json": return "data.json";
        default: return "main.js";
      }
    };

    const project = await prisma.project.create({
      data: {
        name,
        userId: user.id,
        files: {
          create: {
            name: getDefaultFileName(language),
            language,
            content: getDefaultContent(language),
          },
        },
      },
    });

    res.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/projects/[id]
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/projects/[id]
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { files, replace } = req.body;

    if (replace) {
      await prisma.file.deleteMany({
        where: { projectId: id },
      });
    }

    await prisma.$transaction(
      files.map((file) =>
        prisma.file.upsert({
          where: { id: file.id || "temp-id" },
          update: {
            name: file.name,
            content: file.content,
          },
          create: {
            name: file.name,
            content: file.content,
            language: file.language,
            projectId: id,
          },
        })
      )
    );

    await prisma.project.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/projects/[id]
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.file.deleteMany({
      where: { projectId: id },
    });

    await prisma.project.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

io.on("connection",(socket)=>{
    console.log("User connected : ",socket.id);

    socket.on("join-room", async (payload, maybeUsername) => {
        try {
            const roomId = typeof payload === "string" ? payload : payload?.roomId;
            const username = typeof payload === "string" ? maybeUsername : payload?.username;
            const clerkId = typeof payload === "string" ? null : payload?.clerkId;
            const email = typeof payload === "string" ? null : payload?.email;

            if (!roomId || !username) return;

            socket.join(roomId);
            socket.data.roomId = roomId;

            let role = "viewer";

            if (clerkId) {
                const user = await prisma.user.upsert({
                    where: { clerkId },
                    update: {
                        name: username,
                    },
                    create: {
                        clerkId,
                        email: email || `${clerkId}@example.local`,
                        name: username,
                    },
                    select: { id: true },
                });

                const room = await prisma.room.upsert({
                    where: { roomId },
                    update: {},
                    create: { roomId },
                    select: { id: true },
                });

                socket.data.dbRoomId = room.id;

                const existingParticipantCount = await prisma.roomParticipant.count({
                    where: { roomId: room.id },
                });

                const desiredRole = existingParticipantCount === 0 ? "host" : "editor";

                const participant = await prisma.roomParticipant.upsert({
                    where: {
                        roomId_userId: {
                            roomId: room.id,
                            userId: user.id,
                        },
                    },
                    update: {
                        lastSeenAt: new Date(),
                    },
                    create: {
                        roomId: room.id,
                        userId: user.id,
                        role: desiredRole,
                        lastSeenAt: new Date(),
                    },
                    select: { role: true },
                });

                role = participant.role;
                socket.data.userId = user.id;
            }

            if (!clerkId) {
                const existingRoomUsers = rooms[roomId] || [];
                role = existingRoomUsers.length === 0 ? "host" : "editor";
            }

            socket.data.role = role;

            if(!rooms[roomId]) rooms[roomId] = [];
            rooms[roomId] = rooms[roomId].filter((u) => u.id !== socket.id);
            rooms[roomId].push({ id: socket.id, username, role });

            emitRoomUsers(roomId);

            console.log(`User ${username} joined room ${roomId} as ${role}`);
            socket.to(roomId).emit("request-content", { requesterId: socket.id });
        } catch (e) {
            console.error("join-room error:", e);
        }
    });

    socket.on("request-content", ({ roomId }) => {
        socket.to(roomId).emit("request-content", { requesterId: socket.id });
    });

    socket.on("file-change",({roomId, fileId, content})=>{
        const role = socket.data.role;
        if (!canMutateRoom(role)) {
            socket.emit("permission-denied", { action: "file-change" });
            return;
        }
        socket.to(roomId).emit("file-change",{fileId, content});
    });

    socket.on("room-content",({roomId, files, activeFileId})=>{
        const role = socket.data.role;
        if (!canMutateRoom(role)) {
            socket.emit("permission-denied", { action: "room-content" });
            return;
        }
        console.log(`Broadcasting room content for ${roomId}:`, files);
        io.to(roomId).emit("room-content",{files, activeFileId});
    })

    socket.on("file-create", ({ roomId, file }) => {
        const role = socket.data.role;
        if (!canMutateRoom(role)) {
            socket.emit("permission-denied", { action: "file-create" });
            return;
        }
        io.to(roomId).emit("file-create", { file });
    });

    socket.on("file-rename", ({ roomId, fileId, newName, language }) => {
        const role = socket.data.role;
        if (!canMutateRoom(role)) {
            socket.emit("permission-denied", { action: "file-rename" });
            return;
        }
        io.to(roomId).emit("file-rename", { fileId, newName, language });
    });

    socket.on("file-delete", ({ roomId, fileId }) => {
        const role = socket.data.role;
        if (!canMutateRoom(role)) {
            socket.emit("permission-denied", { action: "file-delete" });
            return;
        }
        io.to(roomId).emit("file-delete", { fileId });
    });

    socket.on("set-role", async ({ roomId, targetSocketId, role }) => {
        try {
            const requesterRole = socket.data.role;
            if (!isHost(requesterRole)) {
                socket.emit("permission-denied", { action: "set-role" });
                return;
            }

            const nextRole = normalizeRole(role);
            if (!nextRole) return;

            const roomUsers = rooms[roomId] || [];
            const target = roomUsers.find((u) => u.id === targetSocketId);
            if (!target) return;

            if (target.role === "host" && nextRole !== "host") {
                const hostCount = roomUsers.filter((u) => u.role === "host").length;
                if (hostCount <= 1) {
                    socket.emit("permission-denied", { action: "set-role" });
                    return;
                }
            }

            rooms[roomId] = roomUsers.map((u) =>
                u.id === targetSocketId ? { ...u, role: nextRole } : u
            );

            const targetSocket = io.sockets.sockets.get(targetSocketId);
            if (targetSocket) {
                targetSocket.data.role = nextRole;

                if (targetSocket.data.userId && targetSocket.data.dbRoomId) {
                    await prisma.roomParticipant.update({
                        where: {
                            roomId_userId: {
                                roomId: targetSocket.data.dbRoomId,
                                userId: targetSocket.data.userId,
                            },
                        },
                        data: { role: nextRole, lastSeenAt: new Date() },
                    });
                }
            }

            emitRoomUsers(roomId);
        } catch (e) {
            console.error("set-role error:", e);
        }
    });

    socket.on("code-change",({roomId, code})=>{
        socket.to(roomId).emit("code-update",code);
    });

    socket.on("leave-room",(roomId)=>{
        socket.leave(roomId);
        if(rooms[roomId]){
            rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
            io.to(roomId).emit("user-left", rooms[roomId]);
        }
    })
    socket.on("disconnect", async () => {
        for(const roomId in rooms){
            rooms[roomId] = rooms[roomId].filter(user => user.id !== socket.id);
            io.to(roomId).emit("user-left", rooms[roomId]);
        }

        try {
            if (socket.data.userId && socket.data.dbRoomId) {
                await prisma.roomParticipant.update({
                    where: {
                        roomId_userId: {
                            roomId: socket.data.dbRoomId,
                            userId: socket.data.userId,
                        },
                    },
                    data: { lastSeenAt: new Date() },
                });
            }
        } catch (e) {
            console.error("disconnect lastSeenAt update error:", e);
        }
        console.log(`User disconnected: ${socket.id}`);
    });
});