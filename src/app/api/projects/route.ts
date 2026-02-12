import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/lib/utils";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { files : true },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

  const { name = "Untitled Project", language = "javascript" } = await req.json();

  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const clerkUser = await currentUser();
    
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
        name: clerkUser?.firstName || "User",
      },
    });
  }

  const getDefaultContent = (lang: string) => {
    switch (lang) {
      case "python":
        return "print('Hello World')";
      case "java":
        return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`;
      case "cpp":
        return `#include <iostream>
using namespace std;

int main() {
    cout << "Hello World" << endl;
    return 0;
}`;
      case "html":
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>`;
      case "css":
        return `/* CSS Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
}

h1 {
    color: #333;
}`;
      case "typescript":
        return `// TypeScript Hello World
const message: string = "Hello World";
console.log(message);`;
      case "json":
        return `{
  "message": "Hello World",
  "version": "1.0.0"
}`;
      default:
        return "console.log('Hello World');";
    }
  };

  const getDefaultFileName = (lang: string) => {
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

  return NextResponse.json(project);
}
