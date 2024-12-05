import { JWT_SECRET } from "./config";
import jwt, { JwtPayload } from "jsonwebtoken";
import client from "@repo/db/client";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./type";
import { WebSocket } from "ws";

export class User {
    public id: string;
    public userId?: string;
    private spaceId?: string;
    private x: number;
    private y: number;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = "jkdfjgka";
        this.x = 0;
        this.y = 0;
        this.ws = ws;
        this.initHandlers();
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            const parsedData = JSON.parse(data.toString());
            switch(parsedData.type) {
                case "join":
                    const spaceId = parsedData.payload.spaceId;
                    const token = parsedData.payload.token;
                    const userId = (jwt.verify(token, JWT_SECRET) as JwtPayload).userId;
                    if(!userId) {
                        this.ws.close();
                        return;
                    }
                    this.userId = userId;

                    const space = await client.space.findFirst({
                        where: {
                            id: spaceId
                        }
                    })
                    if(!space) {
                        this.ws.close();
                        return;
                    }
                    this.spaceId = spaceId;
                    RoomManager.getInstance().addUser(spaceId, this);
                    this.x = Math.floor(Math.random() * space.width);
                    this.y = Math.floor(Math.random() * space.height);
                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: {
                                userId: this.userId,
                                x: this.x,
                                y: this.y 
                            },
                            users: RoomManager.getInstance().rooms.get(spaceId)?.filter(x => x.id !== this.id).map((u) => ({id: u.id }))
                        }
                    });
                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: userId,
                            x: this.x,
                            y: this.y
                        }
                    }, spaceId, this);
                    break;
                case "move":
                    const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;
                    const xDisplacemnt = Math.abs(this.x - moveX);
                    const yDisplacemnt = Math.abs(this.y - moveY);
                    if((xDisplacemnt == 1 && yDisplacemnt == 0) || (xDisplacemnt == 0 && yDisplacemnt == 1)) {
                        this.x = moveX;
                        this.y = moveY;
                        RoomManager.getInstance().broadcast({
                            type: "movement",
                            payload: {
                                x: this.x,
                                y: this.y
                            }
                        }, spaceId, this)
                        return;
                    }
                    this.send({
                        type: "movement rejected",
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    });
            }
        });
    }

    send(payload: OutgoingMessage) {
        this.ws.send(JSON.stringify(payload));
    }

    remove() {
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }, this.spaceId!, this );
        RoomManager.getInstance().removeUser(this, this.spaceId!);
    }
   
}