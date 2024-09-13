import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { envServer } from "@/lib/env/env.server";

import tableSchemas, { tableRelations } from "./schemas";

class Database {
    private static instance: Database;
    public db: PostgresJsDatabase<typeof tableSchemas & typeof tableRelations>;
    public adapter: DrizzlePostgreSQLAdapter;

    private constructor() {
        const sql = postgres(envServer.DB_URL);
        this.db = drizzle(sql, {
            schema: {
                ...tableSchemas,
                ...tableRelations,
            },
        });
        this.adapter = new DrizzlePostgreSQLAdapter(
            this.db,
            tableSchemas.sessionTable,
            tableSchemas.userTable,
        );
        Database.instance = this;
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }
}
export default Database;
