import { Router } from "express";
import { CreateAvatarSchema, CreateElementSchema, CreateMapSchema, UpdateElementSchema } from "../types/types";
import adminMiddleware from "../middleware/admin";
import client from "@repo/db/client"

export const adminRouter = Router();
adminRouter.use(adminMiddleware);

adminRouter.post("/element", async(req, res) => {
    const parsedInput = CreateElementSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({ message: "Invalid inputs"})
        return
    }

    try {
        const element = await client.element.create({
            data: {
               imageUrl: parsedInput.data.imageUrl,
               width: parsedInput.data.width,
               height: parsedInput.data.height,
               static: parsedInput.data.static
            }
        })
    
        res.json({ 
            elementId: element.id 
        });
        return;
    } catch (error) {
        res.status(400).json({ message: "Element creation failed" })
    }
    
})

adminRouter.put("/element/:elementId", async(req, res) => {
    const parsedInput = UpdateElementSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({ message: "Invalid inputs"})
        return;
    }

    try {
        await client.element.update({
            where: {
                id: req.params.elementId
            },
            data: {
                imageUrl: parsedInput.data.imageUrl
            }
        })
    
        res.json({ message: "Element updated"});
        return;
    } catch (error) {
        res.json({ message: "Element updation failed "} )
    }
   
})

adminRouter.post("/avatar", async(req, res) => {
    const parsedInput = CreateAvatarSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({ message: "Invalid inputs"})
        return;
    }

    try {
        const avatar = await client.avatar.create({
            data: {
                name: parsedInput.data.name,
                imageUrl: parsedInput.data.imageUrl
            }
        })
    
        res.json({ avatarId: avatar.id});
        return;
    } catch (error) {
        res.status(400).json({ message: "Avatar updaion failed"})
    }
    
})

adminRouter.post("/map", async(req, res) => {
    const parsedInput = CreateMapSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({ message: "Invalid inputs"});
        return;
    }

    try {
        const map = await client.map.create({
            data: {
                name: parsedInput.data.name,
                thumbnail: parsedInput.data.thumbnail,
                width: parseInt(parsedInput.data.dimensions.split("x")[0]),
                height: parseInt(parsedInput.data.dimensions.split("x")[1]),
                elements: {
                    create: parsedInput.data.defaultElements.map(e => ({
                        elementId: e.elementId,
                        x: e.x,
                        y: e.y
                    }))
                }
            }
        })
    
        res.json({
            mapId: map.id
        })
        return
    } catch (error) {
        res.status(400).json({
            message: "Message creation failed"
        })
    }
    
})