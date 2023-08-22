import { Certificate, createHmac, randomBytes } from "node:crypto";
import JWT from "jsonwebtoken";
import { prismaClient } from "../lib/db";

export interface CreateUserPayload{
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
}

export interface GetUserTokenPayload{
    email: string;
    password: string;
}

class UserService {

    private static generateHash(salt: string, password: string){
        return createHmac('sha256',salt)
        .update(password)
        .digest('hex')
    }

    public static createUser(payload: CreateUserPayload){
        const {firstName, lastName, email, password} = payload;
        const salt = randomBytes(32).toString('hex');
        const hashedPassword = UserService.generateHash(salt, password);
        return prismaClient.user.create({
            data: {
                firstName,
                lastName,
                email,
                salt,
                password: hashedPassword,
            },
        })
    }

    public static async getUserToken(payload: GetUserTokenPayload){
        const {email, password} = payload;
        const user = await prismaClient.user.findUnique({ where: { email }});
        if(!user) throw new Error('User not found');
        const userSalt = user.salt;
        const userHashPassword = UserService.generateHash(userSalt, password);
        if(userHashPassword !== user.password) throw new Error('Invalid password');
        // Generate a Token
        const token = JWT.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string);
        return token;
    }

    public static getUserByID(id: string){
        return prismaClient.user.findUnique({ where: { id }});
    }
    public static decodeJWTToken(token: string){
        return JWT.verify(token, process.env.JWT_SECRET as string);
    }
}

export default UserService;