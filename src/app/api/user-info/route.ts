import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await currentUser();
    
    return NextResponse.json({
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username,
      emailAddresses: user?.emailAddresses,
      imageUrl: user?.imageUrl
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
