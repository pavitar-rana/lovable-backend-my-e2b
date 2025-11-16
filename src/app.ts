import express from "express";
import cors from "cors";
import filesRoutes from "./routes/files.routes.ts";
import projectRoutes from "./routes/project.routes.ts";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/files", filesRoutes);
app.use("/startProject", projectRoutes);

export default app;
