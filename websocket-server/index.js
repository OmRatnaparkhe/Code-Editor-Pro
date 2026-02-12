import { Server } from "socket.io"
import { PrismaClient } from "@prisma/client"


const server = process.env.PORT || 4000;
const io = new Server(server,{
    cors:{
        methods:["GET","POST"],
        origin:"*"
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