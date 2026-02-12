import { prisma } from "src/lib/utils";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const clerkUser = await currentUser();

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    const newUser = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
        name: clerkUser?.firstName || "User",
      },
    });
    
    const projects = await prisma.project.findMany({
      where: { userId: newUser.id },
      orderBy: { updatedAt: "desc" },
    });

    return <DashboardClient projects={projects} />;
  }

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return <DashboardClient projects={projects} />;
}
