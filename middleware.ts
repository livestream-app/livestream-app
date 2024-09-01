import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

import { middlewareRoutes } from "./lib/configs/middleware.config";

async function verifySession(sessionId: string, origin: string) {
    const response = await fetch(`${origin}/api/auth/verify-session`, {
        headers: {
            Cookie: `auth_session=${sessionId}`,
        },
        cache: "force-cache",
    });
    return response.ok;
}

export async function middleware(request: NextRequest) {
    const { pathname, origin } = request.nextUrl;
    const sessionId = request.cookies.get("auth_session");
    const isPublicRoute = middlewareRoutes.publicRoutes.has(pathname);
    if (!sessionId) {
        return isPublicRoute
            ? NextResponse.next()
            : NextResponse.redirect(
                  new URL(
                      middlewareRoutes.DEFAULT_SIGNIN_REDIRECT,
                      request.url,
                  ),
              );
    }
    const isValidSession = await verifySession(sessionId.value, origin);
    if (!isValidSession) {
        return NextResponse.redirect(
            new URL(middlewareRoutes.DEFAULT_SIGNIN_REDIRECT, request.url),
        );
    }
    if (isPublicRoute) {
        return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        `/((?!_next|api|trpc|.*\\.(?:jpg|jpeg|gif|png|webp|svg|ico|css|js|woff|woff2)).*)`,
    ],
};
