import express from "express"
import color from "@colors/colors"
import cors from 'cors'
import morgan from "morgan";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { DB } from "./DB/DB_connection.js";


const app = express()
const port = process.env.PORT

DB

app.get('/', (req, res) => res.send('Welcome 💱'))
app.listen(port, () => console.log(`App Runing On Port ${port}`.america.bold+" 📖"))