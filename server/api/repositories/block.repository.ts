import { Utils } from "../lib/helpers/utils";
import { BlockValidation } from "../lib/validations/schema.validation";
import { blockRoutes } from "../routes/block.routes";
import { and, desc, eq, inArray, like, or } from "drizzle-orm";

import Database from "@/server/db";
import tableSchemas from "@/server/db/schemas";
import { blockRelations } from "@/server/db/schemas/block.table";

export interface IBlockRepository
    extends Utils.AutoMappedClass<BlockRepository> {}

export class BlockRepository implements IBlockRepository {
    private db;
    constructor() {
        this.db = Database.getInstance().db;
    }
    async findBlockedByUserId(
        userId: string,
        offset: number = 0,
        limit: number = 10,
    ) {
        try {
            const blockeds = await this.db.query.blockTable.findMany({
                where: eq(tableSchemas.blockTable.blockerId, userId),
                with: {
                    blocked: true,
                },
                offset: offset,
                limit: limit,
                orderBy: desc(tableSchemas.blockTable.createdAt),
            });

            return blockeds;
        } catch (error) {}
    }
    async blockUser(data: BlockValidation.Insert) {
        try {
            return await this.db.transaction(async (tx) => {
                const [newBlock] = await tx
                    .insert(tableSchemas.blockTable)
                    .values(data)
                    .returning();
                await tx
                    .delete(tableSchemas.followTable)
                    .where(
                        or(
                            and(
                                eq(
                                    tableSchemas.followTable.followerId,
                                    data.blockerId,
                                ),
                                eq(
                                    tableSchemas.followTable.followedId,
                                    data.blockedId,
                                ),
                            ),
                            and(
                                eq(
                                    tableSchemas.followTable.followerId,
                                    data.blockedId,
                                ),
                                eq(
                                    tableSchemas.followTable.followedId,
                                    data.blockerId,
                                ),
                            ),
                        ),
                    );
                return newBlock;
            });
        } catch (error) {
            console.log(error);
        }
    }
    async unblockUser(data: BlockValidation.Delete) {
        try {
            const rows = await this.db
                .delete(tableSchemas.blockTable)
                .where(
                    and(
                        eq(tableSchemas.blockTable.blockerId, data.blockerId),
                        eq(tableSchemas.blockTable.blockedId, data.blockedId),
                    ),
                )
                .returning();
            if (rows.length == 0) {
                return false;
            }
            return true;
        } catch (error) {}
    }
    async findBlockedByEmailOrUsername(
        query: string,
        userId: string,
        offset: number = 0,
        limit: number = 10,
    ) {
        try {
            const blockeds = await this.db.query.blockTable.findMany({
                where: and(
                    eq(tableSchemas.blockTable.blockerId, userId),
                    inArray(
                        tableSchemas.blockTable.blockedId,
                        this.db
                            .select({ id: tableSchemas.userTable.id })
                            .from(tableSchemas.userTable)
                            .where(
                                or(
                                    like(
                                        tableSchemas.userTable.email,
                                        `%${query}%`,
                                    ),
                                    like(
                                        tableSchemas.userTable.username,
                                        `%${query}%`,
                                    ),
                                ),
                            ),
                    ),
                ),
                with: {
                    blocked: true,
                },
                offset: offset,
                limit: limit,
                orderBy: desc(tableSchemas.blockTable.createdAt),
            });
            return blockeds;
        } catch (error) {
            console.log(error);
        }
    }
    async findBlockedByBlockerAndBlocked(data: BlockValidation.Insert) {
        try {
            const block = await this.db.query.blockTable.findFirst({
                where: and(
                    eq(tableSchemas.blockTable.blockerId, data.blockerId),
                    eq(tableSchemas.blockTable.blockedId, data.blockedId),
                ),
            });
            return block;
        } catch (error) {}
    }
    async isBlockedOrBlocking(blockerId: string, blockedId: string) {
        try {
            const block = await this.db.query.blockTable.findFirst({
                where: or(
                    and(
                        eq(tableSchemas.blockTable.blockerId, blockerId),
                        eq(tableSchemas.blockTable.blockedId, blockedId),
                    ),
                    and(
                        eq(tableSchemas.blockTable.blockerId, blockedId),
                        eq(tableSchemas.blockTable.blockedId, blockerId),
                    ),
                ),
            });
            if (block) return true;
            return false;
        } catch (error) {}
    }
}