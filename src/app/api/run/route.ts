import { NextRequest, NextResponse } from "next/server"
import { corsResponse, corsMiddleware } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: corsMiddleware(req)
  });
}

export async function POST(req:NextRequest){
    try{
        const { language, version, code } = await req.json();
        const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

        const response = await fetch(PISTON_API_URL,{
            method:"POST",
            headers:{"Content-type" : "application/json"},
            body:JSON.stringify({
                language:language,
                version:version,
                files:[
                    { content : code }
                ]
            })
        });

        const result = await response.json();
        
        const apiResponse = NextResponse.json(result);
        return corsResponse(apiResponse, req);
    }
    catch(e){
        const response = NextResponse.json(
            { error: "Failed to execute code" },
            { status : 500 }
        );
        return corsResponse(response, req);
    }
}