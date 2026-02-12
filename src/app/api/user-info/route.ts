import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { corsResponse, corsMiddleware } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: corsMiddleware(req)
  });
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      const response = new NextResponse("Unauthorized", { status: 401 });
      return corsResponse(response, req);
    }

    const user = await currentUser();
    
    const response = NextResponse.json({
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username,
      emailAddresses: user?.emailAddresses,
      imageUrl: user?.imageUrl
    });
    return corsResponse(response, req);
  } catch (error) {
    console.error("Error fetching user info:", error);
    const response = new NextResponse("Internal Server Error", { status: 500 });
    return corsResponse(response, req);
  }
}
