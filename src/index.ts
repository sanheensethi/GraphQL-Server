import express from 'express';
import createApolloGraphqlServer from './graphql';
import { expressMiddleware } from '@apollo/server/express4'
import UserService from './services/user';

async function init(){

    const app = express();
    const PORT = Number(process.env.PORT) || 8000;
    app.use(express.json());
    // Default Path
    app.get('/', (req, res) => {
        res.json({ message: 'Server is Running! 🚀' });
    })
    // GraphQL Path
    app.use("/graphql", expressMiddleware(await createApolloGraphqlServer(), { context: async ({req})=>{
        try{
            // @ts-ignore
            const user = await UserService.decodeJWTToken(req.headers['token']);
            return { user };
        }catch(err){
            return { user: null, error: err };
        }
    }}));
    app.listen(PORT, () => {
        console.log(`Server is running on PORT ${PORT}`);
    });
}

init();