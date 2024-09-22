import { HttpStatus } from "../lib/constant/http.type";
import { ApiResponse } from "../lib/helpers/api-response";
import { MyError } from "../lib/helpers/errors";
import { Utils } from "../lib/helpers/utils";
import { CreateFactoryType } from "../lib/types/factory.type";
import { UserValidation } from "../lib/validations/schema.validation";
import { Validator } from "../lib/validations/validator";
import { IUserService } from "../services/user.service";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export interface ISearchController
    extends Utils.PickMethods<SearchController, "setupHandlers"> {}

export class SearchController implements ISearchController {
    constructor(
        private factory: CreateFactoryType,
        private userService: IUserService,
    ) {}
    setupHandlers() {
        return this.factory.createApp().get("/", ...this.search());
    }
    private search() {
        const queries = z.object({
            page: z.preprocess(
                (x) => (x ? x : undefined),
                z.coerce.number().int().min(1).default(1),
            ),
            size: z.preprocess(
                (x) => (x ? x : undefined),
                z.coerce.number().int().min(0).default(10),
            ),
            filterBy: z.string().optional(),
            dateFrom: z.preprocess((x) => {
                if (typeof x === "string" || x instanceof Date) {
                    const parsedDate = new Date(x);
                    return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
                }
                return undefined;
            }, z.date().optional()),
            dateTo: z.preprocess((x) => {
                if (typeof x === "string" || x instanceof Date) {
                    const parsedDate = new Date(x);
                    return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
                }
                return undefined;
            }, z.date().optional()),
            isSortByCreatedAt: z.preprocess(
                (x) => (x ? x : undefined),
                z.coerce.boolean(),
            ),
            sortOrder: z.string().optional(),
        });
        return this.factory.createHandlers(
            zValidator("query", queries, Validator.handleParseError),
            async (c) => {
                const {
                    page,
                    size,
                    dateFrom,
                    dateTo,
                    filterBy,
                    isSortByCreatedAt,
                    sortOrder,
                } = c.req.valid("query");
                const users = await this.userService.advancedSearchUser(
                    filterBy,
                    dateFrom,
                    dateTo,
                    isSortByCreatedAt,
                    sortOrder,
                    (page - 1) * size,
                    size,
                );
                if (!users) {
                    throw new MyError.BadRequestError(
                        "Failed to fetch search result",
                    );
                }
                return ApiResponse.WriteJSON({
                    c,
                    data: {
                        users: UserValidation.parseMany(users),
                    },
                    status: HttpStatus.OK,
                });
            },
        );
    }
}
