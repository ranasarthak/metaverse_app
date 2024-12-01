import { Router } from "express";
import { GetMetaDataBulkSchema, UpdateMetaDataSchema } from "../types/types";
import userMiddleware from "../middleware/user";
import client from "@repo/db/client";

export const userRouter = Router();

userRouter.use(userMiddleware);

userRouter.post("/metadata", async(req, res) => {
    const parsedInput = UpdateMetaDataSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({ message: "Invalid inputs" })
        return;
    }

    try {
        await client.user.update({
            where: {
                id: req.userId
            },
            data: {
                avatarId: parsedInput.data.avatarId
            }
        })
        res.json({ message: "Metadata updated successfully" });
    }catch(e) {
        res.status(400).json({ message: "Updation failed." });
    }
})

userRouter.get("/metadata/bulk", async(req, res) => {
    try {
        const userIdString = GetMetaDataBulkSchema.safeParse(req.query.ids ?? "[]");
        if(!userIdString.success) {
        throw new Error();
        }

        const userIds = userIdString.data?.idString.slice(1, userIdString.data.idString.length - 1).split(",");

        const metadata = await client.user.findMany({
            where: {
                id: {
                    in: userIds
                }
            },
            select: {
                avatar: true,
                id: true
            }
        })
        res.json({
            avatars: metadata.map(m => ({
                userId: m.id,
                avatars: m.avatar?.imageUrl
            }))
        })
        return;
    } catch (error) {
        res.status(404).json({
            message: "No match found"
        })
    }
})