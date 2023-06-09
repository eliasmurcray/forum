import { MikroORM } from "@mikro-orm/core";
import { Post } from "./entities/Post";
import path from "path";
import { User } from "./entities/User";
import { __prod__ } from "./constants";

export default <Parameters<typeof MikroORM.init>[0]>{
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  dbName: "forum",
  type: "postgresql",
  debug: !__prod__,
  allowGlobalContext: true,
};
