  import { OutgoingMessage } from "./type";
import { User } from "./user";

export class RoomManager {
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager;

    static getInstance() {
        if(!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public addUser(space: string, user: User) {
        if(!this.rooms.has(space)) {
            this.rooms.set(space, [user]);
        }
        this.rooms.set(space, [...(this.rooms.get(space) ?? []), user]);
    }

    public broadcast(message: OutgoingMessage, roomId: string, user: User) {
        if(!this.rooms.has(roomId)) {
            return;
        }
        this.rooms.get(roomId)?.forEach((u) => {
            if(u.id !== user.id){
                u.send(message);
            }
        })
    }

    public removeUser(user: User, spaceId: string) {
        if(!this.rooms.has(spaceId)) {
            return;
        }
        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []));
    }
}