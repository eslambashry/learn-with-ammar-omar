import express from "express";
import color from "@colors/colors";
import cors from 'cors';
import morgan from "morgan";
import { DB } from "./DB/DB_connection.js";

// Routes
import authRouter from './src/modules/auth/auth.routes.js';
import courseRouter from './src/modules/course/course.routes.js';
import enrollmentRouter from './src/modules/enrollment/enrollment.routes.js';
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Course Platform API",
      version: "1.0.0",
      description: "API Documentation for Courses, Videos & Auth",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // 👇 VERY IMPORTANT — where swagger reads your comments from
  apis: [
    "./src/modules/auth/auth.routes.js",   // controllers & routes
    "./src/modules/course/course.routes.js",   // controllers & routes
    "./src/modules/enrollment/enrollment.routes.js",   // controllers & routes
    // "./src/modules/video/video.routes.js",   // controllers & routes
    // "./src/modules/user/user.routes.js",   // controllers & routes
    // "./src/modules/lesson/lesson.routes.js",   // controllers & routes
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export const swaggerSetup = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

DB();
swaggerSetup(app);

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/enroll', enrollmentRouter);
app.get('/', (req, res) => res.send('Welcome to LMS API 📚'));

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

app.listen(port, () => console.log(`App Running On Port ${port}`.green.bold + " 🚀"));