import { NextFunction, Request, Response } from "express";
import { JWT_SECRET } from "../config";
import jwt from "jsonwebtoken";

export default function adminMiddleware (req: Request, res: Response, next: NextFunction){
    // console.log("usertoken: ", req.headers.authorization);
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if(!token){
            res.status(403).json({message: "Unauthorized"})
            return;
        }

        const decoded = jwt.verify( token, JWT_SECRET ) as { userId: string, role: string };
        if(decoded.role != "Admin") {
            res.status(403).json({message: "Unauthorized"})
            return;
        }
        
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorised" })
        return;
    }
}