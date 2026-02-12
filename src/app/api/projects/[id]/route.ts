import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "src/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

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
      return new NextResponse("Project not found", { status: 404 });
    }

    if (project.userId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { files, replace } = await req.json();
    const projectId = resolvedParams.id;

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id)
      return new NextResponse("Forbidden", { status: 403 });

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

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error updating project:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const { name } = await req.json();
    const projectId = resolvedParams.id;

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id)
      return new NextResponse("Forbidden", { status: 403 });

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { name },
    });

    return NextResponse.json(updatedProject);
  } catch (e) {
    console.error("Error updating project name:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.id;

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== user.id)
      return new NextResponse("Forbidden", { status: 403 });

    await prisma.file.deleteMany({
      where: { projectId },
    });

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error deleting project:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
