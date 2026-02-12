import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsResponse, corsMiddleware } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: corsMiddleware(req)
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      const response = new NextResponse("Unauthorized", { status: 401 });
      return corsResponse(response, req);
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const resolvedParams = await params;
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: { files: true },
    });

    if (!project) {
      const response = new NextResponse("Project not found", { status: 404 });
      return corsResponse(response, req);
    }

    if (project.userId !== user.id) {
      const response = new NextResponse("Forbidden", { status: 403 });
      return corsResponse(response, req);
    }

    const response = NextResponse.json(project);
    return corsResponse(response, req);
  } catch (error) {
    console.error("Error fetching project:", error);
    const response = new NextResponse("Internal Server Error", { status: 500 });
    return corsResponse(response, req);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      const response = new NextResponse("Unauthorized", { status: 401 });
      return corsResponse(response, req);
    }

    const resolvedParams = await params;
    const { files, replace } = await req.json();
    const projectId = resolvedParams.id;

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      const response = new NextResponse("User not found", { status: 404 });
      return corsResponse(response, req);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      const response = new NextResponse("Forbidden", { status: 403 });
      return corsResponse(response, req);
    }

    if (replace) {
      await prisma.file.deleteMany({
        where: { projectId },
      });
    }

    await prisma.$transaction(
      files.map((file: any) =>
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
            projectId,
          },
        })
      )
    );

    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    const response = NextResponse.json({ success: true });
    return corsResponse(response, req);
  } catch (e) {
    console.error("Error updating project:", e);
    const response = new NextResponse("Internal Server Error", { status: 500 });
    return corsResponse(response, req);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      const response = new NextResponse("Unauthorized", { status: 401 });
      return corsResponse(response, req);
    }

    const resolvedParams = await params;
    const { name } = await req.json();
    const projectId = resolvedParams.id;

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      const response = new NextResponse("User not found", { status: 404 });
      return corsResponse(response, req);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      const response = new NextResponse("Forbidden", { status: 403 });
      return corsResponse(response, req);
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { name },
    });

    const response = NextResponse.json(updatedProject);
    return corsResponse(response, req);
  } catch (e) {
    console.error("Error updating project name:", e);
    const response = new NextResponse("Internal Server Error", { status: 500 });
    return corsResponse(response, req);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      const response = new NextResponse("Unauthorized", { status: 401 });
      return corsResponse(response, req);
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      const response = new NextResponse("User not found", { status: 404 });
      return corsResponse(response, req);
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id) {
      const response = new NextResponse("Forbidden", { status: 403 });
      return corsResponse(response, req);
    }

    await prisma.file.deleteMany({
      where: { projectId },
    });

    await prisma.project.delete({
      where: { id: projectId },
    });

    const response = NextResponse.json({ success: true });
    return corsResponse(response, req);
  } catch (e) {
    console.error("Error deleting project:", e);
    const response = new NextResponse("Internal Server Error", { status: 500 });
    return corsResponse(response, req);
  }
}
