import { LuciaService } from "../external-services/lucia.service";
import { MyError } from "../lib/helpers/errors";
import { Env } from "../lib/types/factory.type";
import { every, some } from "hono/combine";
import { getCookie } from "hono/cookie";
import { createFactory } from "hono/factory";

const factory = createFactory<Env>();
const lucia = LuciaService.getInstance();

export namespace AuthMiddleware {
    export const init = factory.createMiddleware(async (c, next) => {
        const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;
        if (!sessionId) {
            c.set("user", null);
            c.set("session", null);
            return next();
        }
        const { session, user } = await lucia.validateSession(sessionId);
        if (session && session.fresh) {
            c.header(
                "Set-Cookie",
                lucia.createSessionCookie(sessionId).serialize(),
                {
                    append: true,
                },
            );
        }
        if (!session) {
            c.header(
                "Set-Cookie",
                lucia.createBlankSessionCookie().serialize(),
                {
                    append: true,
                },
            );
        }
        c.set("user", user);
        c.set("session", session);
        return next();
    });
    export const isAuthenticated = factory.createMiddleware(async (c, next) => {
        const user = c.get("user");
        const session = c.get("session");
        if (!user || !session) {
            throw new MyError.UnauthenticatedError();
        }
        c.set("getUser", user);
        c.set("getSession", session);
        return next();
    });
}
