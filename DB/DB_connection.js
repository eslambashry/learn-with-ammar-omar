import mongoose from "mongoose";
import { config } from 'dotenv'
import path from 'path'
config({path: path.resolve('./config/.env')})

export const DB = async () => {
    return mongoose.connect(process.env.DB_URL)
    .then(() => {console.log("DB Connected successfully 👾".bold.yellow.italic)})
    .catch((err) => {console.log("Connection fail 💩".bold.red)});
}