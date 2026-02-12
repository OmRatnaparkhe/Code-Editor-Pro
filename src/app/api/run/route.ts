import { NextRequest, NextResponse } from "next/server"

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
        
        return NextResponse.json(result);
    }
    catch(e){
        return NextResponse.json(
            { error: "Failed to execute code" },
            { status : 500 }
        )
    }
}