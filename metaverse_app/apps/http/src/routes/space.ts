import { Router } from "express";
import userMiddleware from "../middleware/user";
import { AddElementSchema, CreateSpaceSchema, DeleteElementSchema } from "../types/types";
import client from "@repo/db/client"

export const spaceRouter = Router();
spaceRouter.use(userMiddleware);

spaceRouter.post("/", async(req, res) => {
    const parsedInput = CreateSpaceSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({
            message: "Invalid inputs"
        })
        return;
    }
    try {
        if(!parsedInput.data.mapId) {
            const space = await client.space.create({
               data: {
                    name: parsedInput.data.name,
                    width: parseInt(parsedInput.data.dimensions.split("x")[0]),
                    height: parseInt(parsedInput.data.dimensions.split("x")[1]),
                    creatorId: req.userId!
               } 
            })
            res.json({
                spaceId: space.id
            })
            return
        }  

        const map = await client.map.findFirst({
            where: {
                id: parsedInput.data.mapId
            },select: {
                elements: true,
                width: true,
                height: true
            }
        })
        if(!map) {
            res.status(400).json({
                message: "Map not found"
            })
            return
        }

        let space = await client.$transaction(async () => {
            const space = await client.space.create({
                data: {
                    name: parsedInput.data.name,
                    width: map.width,
                    height: map.height,
                    creatorId: req.userId!
                }
            })

            await client.spaceElements.createMany({
                data: map.elements.map(e => ({
                    spaceId: space.id,
                    elementId: e.elementId,
                    x: e.x!,
                    y: e.y!
                }))
            })
            return space;
        })
        res.json({
            spaceId: space.id
        })
        return
    } catch (error) {
        res.status(400).json({
            message: "Space creation failed"
        })
    }
})

spaceRouter.get("/all", async(req, res) => {
    try {
        const spaces = await client.space.findMany({
            where: {
                creatorId: req.userId
            }
        })

        if(!spaces) {
            res.status(400).json({
                message: "No space for this account"
            })
            return;
        }

        res.json({
            spaces: spaces.map(s => ({
                id: s.name,
                name: s.name,
                thumbnail: s.thumbnail,
                dimensions: `${s.width}x${s.height}`
            }))
        })
        return;
    } catch (error) {
        res.status(400).json({
            message: "Unable to fetch the requested spaces"
        })
    }
})

spaceRouter.get("/:spaceId", async(req, res) => {
    try {
        const space = await client.space.findUnique({
            where: {
                id: req.params.spaceId
            },
            include: {
                elements: {
                    include: {
                        element: true
                    }
                }
            }
        })

        if(!space) {
            res.status(400).json({
                message: "Space not found"
            })
            return;
        }

        res.json({
            dimensions: `${space.width}x${space.height}`,
            elements: space.elements.map(e => ({
                id: e.id,
                element: {
                    id: e.element.id,
                    width: e.element.width,
                    height: e.element.height,
                    imageUrl: e.element.imageUrl
                },
                x: e.x,
                y: e.y
            }))
        })
        return
    } catch (error) {
        res.status(400).json({
            message: "Unable to fetch the requested space"
        })
    }
})

spaceRouter.post("/element", async(req, res) => {
    const parsedInput = AddElementSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({
            message: "Invalid inputs"
        })
        return;
    }

    try {
        const space = await client.space.findUnique({
            where: {
                creatorId: req.userId,
                id: req.body.spaceId
            },
            select: {
                width: true,
                height: true
            }
        })

        if(!space) {
            res.status(400).json({
                message: "Space not found"
            })
            return
        }

        if(req.body.x < 0 || req.body.y < 0 || req.body.x > space?.width! || req.body.y > space?.height!) {
            res.status(400).json({
                message: "Out of bounds"
            })
            return;
        }

        const spaceElement = await client.spaceElements.create({
            data: {
                elementId: req.body.elementId,
                spaceId: req.body.spaceId,
                x: req.body.x,
                y: req.body.y
            }
        })

        res.json({
            message: "Element added"
        })
    } catch (error) {
        res.status(400).json({
            message: "Failed to add element"
        })
    }
})

spaceRouter.delete("/element", async(req, res) => {
    const parsedInput = DeleteElementSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({
            message: "Invalid Inputs"
        })
        return
    }

    try {
        const spaceElement = await client.spaceElements.findUnique({
            where: {
                id: req.body.id
            },
            select: {
                space: true
            }
        })

        if(!spaceElement) {
            res.status(400).json({
                message: "No match found"
            })
            return;
        }

        if(!spaceElement.space.creatorId || (spaceElement.space.creatorId !== req.userId)) {
            res.status(403).json({
                message: "Unauthorised"
            })
            return
        }

        await client.spaceElements.delete({
            where: {
                id: parsedInput.data.id
            }
        })

        res.json({
            message: "Element deleted"
        })
        return;
    } catch (error) {
        res.status(400).json({
            message: "Deletion failed"
        })
    }
})

spaceRouter.delete("/:spaceId", async(req, res) => {
    try {
        const space = await client.space.findFirst({
            where: {
                id: req.params.spaceId
            },
            select: {
                creatorId: true
            }
        })

        if(!space) {
            res.status(400).json({ message: "No matching space found"})
            return
        }

        if(space.creatorId != req.userId) {
            res.status(403).json({ message: "Unauthorised"})
            return
        }

        await client.space.delete({
            where: {
                id: req.params.spaceId
            }
        })

        res.json({ message: "Space deleted"});
        return;
    } catch (error) {
        res.status(400).json({ message: "Deletion failed "})
    }
})
