import { MikroORM } from "@mikro-orm/core";
import mikroOrmConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import RedisStore from "connect-redis";
import session from "express-session";
import { createClient } from "redis";
import { __prod__ } from "./constants";
import "reflect-metadata";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();
  const redisClient = createClient({
    url: "redis://localhost:3001",
  });

  try {
    await redisClient.connect();
  } catch (e) {
    console.error(e);
  }

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: __prod__,
        secure: true,
        sameSite: "none",
      },
      secret: "qiowuerpoqiwutqgb",
      resave: false,
      saveUninitialized: false,
    })
  );

  app.set("trust proxy", true);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ res, req }) => ({ em: orm.em, res, req }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors: {
      origin: ["https://studio.apollographql.com", "http://localhost:3000"],
      credentials: true,
    },
  });

  app.listen(3000, () => {
    console.log("Server listening on port 3000.");
  });
};

main();
