import { BlockDTO } from "../dtos/block.dto";
import { QueryDTO } from "../dtos/query.dto";
import { HttpStatus } from "../lib/constant/http.type";
import { ApiResponse } from "../lib/helpers/api-response";
import { MyError } from "../lib/helpers/errors";
import { Utils } from "../lib/helpers/utils";
import { CreateFactoryType } from "../lib/types/factory.type";
import { Validator } from "../lib/validations/validator";
import { AuthMiddleware } from "../middleware/auth.middleware";
import { IBlockService } from "../services/block.service";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export interface IBlockController
    extends Utils.PickMethods<BlockController, "setupHandlers"> {}

export class BlockController implements IBlockController {
    constructor(
        private factory: CreateFactoryType,
        private blockService: IBlockService,
    ) {}
    setupHandlers() {
        return this.factory
            .createApp()
            .post("/:blockerId/:blockedId", ...this.blockToggle())
            .get("/:userId/blocked", ...this.findBlockedByUserId());
    }
    private blockToggle() {
        const params = z.object({
            blockerId: z.string().uuid(),
            blockedId: z.string().uuid(),
        });

        return this.factory.createHandlers(
            zValidator("param", params, Validator.handleParseError),
            AuthMiddleware.isAuthenticated,
            async (c) => {
                const { blockerId, blockedId } = c.req.valid("param");
                const currentUser = c.get("getUser");
                if (currentUser.id !== blockerId) {
                    throw new MyError.UnauthorizedError();
                }
                if (currentUser.id === blockedId) {
                    throw new MyError.BadRequestError();
                }

                const data = await this.blockService.blockToggle({
                    blockerId,
                    blockedId,
                });

                return ApiResponse.WriteJSON({
                    c,
                    data: data,
                    status: HttpStatus.OK,
                });
            },
        );
    }
    private findBlockedByUserId() {
        const params = z.object({
            userId: z.string().uuid(),
        });
        const queries = QueryDTO.createFilterSchema();
        return this.factory.createHandlers(
            zValidator("param", params, Validator.handleParseError),
            zValidator("query", queries, Validator.handleParseError),
            AuthMiddleware.isAuthenticated,
            async (c) => {
                const { userId } = c.req.valid("param");
                const { page, size, filterBy } = c.req.valid("query");

                const currentUser = c.get("getUser");

                if (currentUser.id !== userId) {
                    throw new MyError.UnauthorizedError();
                }
                const blockedQuery =
                    await this.blockService.findBlockedByUserIdWithUsername(
                        filterBy,
                        userId,
                        (page - 1) * size,
                        size,
                    );
                if (!blockedQuery) {
                    throw new MyError.BadRequestError(
                        "Failed to fetch blocked",
                    );
                }
                return ApiResponse.WriteJSON({
                    c,
                    data: {
                        blockeds: BlockDTO.parseUserOnlyMany(blockedQuery),
                    },
                    status: HttpStatus.OK,
                });
            },
        );
    }
}
