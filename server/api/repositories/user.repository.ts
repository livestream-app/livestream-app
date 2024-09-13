import { Utils } from "../lib/helpers/utils";
import { UserValidation } from "../lib/validations/schema.validation";
import { eq, or } from "drizzle-orm";

import Database from "@/server/db";
import tableSchemas from "@/server/db/schemas";

export interface IUserRepository
    extends Utils.AutoMappedClass<UserRepository> {}

export class UserRepository implements IUserRepository {
    private db;
    constructor() {
        this.db = Database.getInstance().db;
    }
    async findById(id: string) {
        try {
            const user = await this.db.query.userTable.findFirst({
                where: eq(tableSchemas.userTable.id, id),
            });
            return user;
        } catch (error) {}
    }
    async findByEmail(email: string) {
        try {
            const user = await this.db.query.userTable.findFirst({
                where: eq(tableSchemas.userTable.email, email),
            });
            return user;
        } catch (error) {}
    }
    async findAll() {
        try {
            const users = await this.db.query.userTable.findMany();
            return users;
        } catch (error) {}
    }
    async create(data: UserValidation.Insert) {
        try {
            const user = await this.db
                .insert(tableSchemas.userTable)
                .values(data)
                .returning();
            return user[0];
        } catch (error) {}
    }
    async update(id: string, data: UserValidation.Update) {
        try {
            const user = await this.db
                .update(tableSchemas.userTable)
                .set(data)
                .where(eq(tableSchemas.userTable.id, id))
                .returning();

            return user[0];
        } catch (error) {}
    }
    async delete(id: string) {
        try {
            const rows = await this.db
                .delete(tableSchemas.userTable)
                .where(eq(tableSchemas.userTable.id, id));
            if (rows.length == 0) {
                return false;
            }
            return true;
        } catch (error) {}
    }
    async findByEmailOrUsername(email: string, username: string) {
        try {
            const user = await this.db.query.userTable.findFirst({
                where: or(
                    eq(tableSchemas.userTable.email, email),
                    eq(tableSchemas.userTable.username, username),
                ),
            });
            return user;
        } catch (error) {}
    }
}
