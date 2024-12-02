import express from "express";
import { SiginSchema, SignupSchema } from "../types/types";
import { adminRouter } from "./admin";
import { spaceRouter } from "./space";
import { userRouter } from "./user";
import client from "@repo/db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import userMiddleware from "../middleware/user";

const app = express;
export const router = express.Router();



router.post("/signup", async(req, res) => {
    const parsedInput = SignupSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(400).json({
            message: "Invalid inputs"
        })
        return;
    }

    const hashedPassword = await bcrypt.hash(parsedInput.data.password, 10);

    try{
        const user = await client.user.create({
            data:{
                username: parsedInput.data.username,
                password: hashedPassword,
                role: parsedInput.data.type === "admin" ? "Admin" : "User"
            }
        })
        const token = jwt.sign({
            userId: user.id,
            role: user.role
        }, JWT_SECRET);
        res.json({
            userId: user.id,
            token
        })
        return
    }catch(e){
        res.status(400).json({
            message: "User already exists"
        })
        return
    }
})


router.post("/signin", async(req, res) => {
    const parsedInput = SiginSchema.safeParse(req.body);
    if(!parsedInput.success) {
        res.status(403).json({
            message: "Invalid inputs"
        })
        return
    }

    try {
        const user = await client.user.findUnique({
            where: {
                username: parsedInput.data.username
            }
        })
        if(!user){
            res.status(403).json({
                message: "User not found"
            })
            return
        }
    
        const isValid = await bcrypt.compare(parsedInput.data.password, user.password);
        if(!isValid) {
            res.status(403).json({
                message: "Incorrect login credentials"
            })
            return
        }
    
        const token = jwt.sign({
            userId: user.id,
            role: user.role
        }, JWT_SECRET);
    
        res.json({
            token
        })
        return
    } catch (error) {
        res.status(403).json({
            message: "Internal server error"
        })
        return
    }
    
})


router.get("/avatars", userMiddleware,  async(req, res) => {
    try {
        const avatars = await client.avatar.findMany();
        if(!avatars) {
            res.status(400).json({
                message: "No avatars found"
            })
            return;
        }

        res.json({
            avatars: avatars.map(x => ({
                id: x.id,
                name: x.name,
                imageUrl: x.imageUrl
            }))
        }) 
        return;
    } catch (error) {
        res.status(500).json({
            message: "Request failed"
        })
    }
})


router.get("/elements", async(req, res) => {
    try {
        const elements = await client.element.findMany();
        if(!elements) {
            res.status(400).json({
                message: "No elements found"
            })
        }

        res.json({
            elements: elements.map(e => ({
                id: e.id,
                width: e.width,
                height: e.height,
                imageUrl: e.imageUrl,
                static: e.static
            }))
        })
        return
    } catch (error) {
        res.status(400).json({
            message: "Request failed"
        })
    }
})

router.use("/admin", adminRouter);
router.use("/user", userRouter);
router.use("/space", spaceRouter);