import { NextRequest, NextResponse } from "next/server";

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://code-editor-pro-frxe.onrender.com",
    "http://localhost:3000",
    "https://code-editor-ws-l151.onrender.com"
  ];

  const allowedOrigin = allowedOrigins.includes(origin || "") ? origin : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin || allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function corsResponse(response: NextResponse, request: NextRequest) {
  const headers = corsMiddleware(request);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
