import express from "express";
import cors from "cors";
import { createClient } from 'redis';
import mysql from 'mysql2/promise';
import dotenv from "dotenv";

try {
  dotenv.config();
  console.log(process.env);
} catch (error) {
  console.log(error);
}

const expressPort = process.env.PORT || 5001;

const redisUsername = process.env.REDIS_USERNAME || "";
const redisPassword = process.env.REDIS_PASSWORD || "";
const redisHost = process.env.REDIS_HOST || "";
const redisPort = process.env.REDIS_PORT || "";
const redisChannel = process.env.REDIS_CHANNEL || "";

const sqlHost = process.env.MYSQL_HOST || "";
const sqlUser = process.env.MYSQL_USERNAME || "";
const sqlPassword = process.env.MYSQL_PASSWORD || "";
const sqlDatabase = process.env.MYSQL_DATABASE || "";
const sqlTable = process.env.MYSQL_TABLE || "";

const redisUrl = `redis://${redisUsername}:${redisPassword}@${redisHost}:${redisPort}`;
const redisClient = createClient({ url: redisUrl });
const dbConfig = {
  host: sqlHost,
  user: sqlUser,
  password: sqlPassword,
  database: sqlDatabase,
};


const getData = async () => {
  const sqlQuery = `SELECT data FROM ${sqlTable}`;
  const sqlConnection = await mysql.createConnection(dbConfig);
  return sqlConnection.execute(sqlQuery);
};

const setRedisCache = async (jsonData) => {
  const value = JSON.stringify({ isCached: "yes", data: jsonData });
  await redisClient.connect();
  await redisClient.set("key", value);
  return redisClient.disconnect();
};

const getRedisCache = async () => {
  await redisClient.connect();
  const cachedData = await redisClient.get("key");
  await redisClient.disconnect();
  return cachedData;
};

const deleteRedisCache = async () => {
  await redisClient.connect();
  await redisClient.del("key");
  return redisClient.disconnect();
};

const publishToRedis = async (data) => {
  await redisClient.connect();
  const subscriberCount = await redisClient.publish(redisChannel, data);
  await redisClient.disconnect();
  return subscriberCount;
};


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => res.status(200).send("connected to server 1!"));

app.get("/data", async (_, res) => {
  try {
    const cachedData = await getRedisCache();
    const results = JSON.parse(cachedData);
    if (cachedData) {
      res.status(200).json({ message: "success", ...results });
    } else {
      const [data, _] = await getData();
      await setRedisCache(data);
      res.status(200).json({ message: "success", isCached: "no", data });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "failure", error });
  }
});

app.post("/create", async (req, res) => {
  const { data } = req.body;
  try {
    if (!data) throw new Error("missing data");
    const subscriberCount = await publishToRedis(data);
    console.log({ subscriberCount });
    await deleteRedisCache();
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "failure", error });
  }
});

app.listen(expressPort, () => console.log(`webserver is listening to ${expressPort} port !!!`));
