import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { CreateTreeFile } from "../../helper/create-tree-file.ts";
import { runCommandInSandbox } from "../lib/helpers.ts";
import { ProjectValidatorHttp, UserValidatorHttp } from "../validators/db.validators.ts";

const router = Router();

router.post("/", async (req, res) => {
  const { sandboxId, userId, projectId } = req.body;

  console.log("file for projectId : ", projectId);

  if (!sandboxId || !userId || !projectId) {
    return res.status(400).json({
      success: false,
      message: "sandboxId, userId, and projectId are required",
    });
  }

  const user = await UserValidatorHttp(userId, res);

  const project = await ProjectValidatorHttp(userId, projectId, res);

  try {
    await CreateTreeFile(sandboxId, projectId, userId);
    const execution = await runCommandInSandbox("node getTree.js", sandboxId, userId, projectId);
    const result = JSON.parse(execution);

    return res.json({
      success: true,
      message: "Success Getting files",
      files: result.files,
      tree: result.tree,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload files",
      details: error.message,
    });
  }
});

export default router;
