import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4'
import { prismaClient } from './lib/db';

async function init(){

    const app = express();
    const PORT = Number(process.env.PORT) || 8000;
    app.use(express.json());

    // grapgql server
    const gqlServer = new ApolloServer({
        typeDefs: `
            type Query {
                hello: String
                say(name: String): String
            }
            type Mutation {
                createUser(firstName: String!, lastName: String!, email: String!, password: String!): Boolean
            }
        `, // Schema
        resolvers: {
            Query: {
                hello: () => 'Hey There! I am a GraphQL Server.',
                say: (_,{name}: {name: String}) => `Hey ${name}! How are you?`
            },
            Mutation: {
                createUser: async (_,{
                        firstName,
                        lastName,
                        email,
                        password
                    }: {
                        firstName: string;
                        lastName: string;
                        email: string;
                        password: string;
                    }
                ) => {
                    // Create User
                    try {
                        await prismaClient.user.create({
                            data: {
                                firstName,
                                lastName,
                                email,
                                password,
                                salt: "salt"
                            }
                        });
                        return true;
                    } catch (error) {
                        console.error("Error creating user:", error);
                        throw new Error("Failed to create user");
                    }
                }
            }
        } // Resolvers
    });

    // Start the gql server
    await gqlServer.start();

    // Default Path
    app.get('/', (req, res) => {
        res.json({ message: 'Server is Running! 🚀' });
    })

    // GraphQL Path
    app.use("/graphql", expressMiddleware(gqlServer));

    app.listen(PORT, () => {
        console.log(`Server is running on PORT ${PORT}`);
    });
}

init();