import { Router } from "express";
import { prisma } from "../lib/prisma.ts";
import { createSandbox, runCommandInSandbox, streamToString, writeFileToSandbox } from "../lib/helpers.ts";
import { VM_TO_HOST_PORT } from "../lib/constants.ts";
import { blobServiceClient } from "../config/azureBlob.ts";
import { ProjectValidatorHttp, UserValidatorHttp } from "../validators/db.validators.ts";

const router = Router();

router.get("/:projectId", async (req, res) => {
  const { projectId } = req.params;
  let userId = req.headers["userid"];
  if (Array.isArray(userId)) {
    userId = userId[0];
  }

  if (!userId || typeof userId !== "string" || !projectId) {
    return res.status(400).json({
      success: false,
      message: "userId and projectId needed",
    });
  }

  const user = await UserValidatorHttp(userId, res);

  const project = await ProjectValidatorHttp(userId, projectId, res);

  const sbx = await createSandbox(userId);

  if (!sbx) {
    return res.json({
      success: false,
      message: "Failed to start sandbox",
    });
  }

  const sbxId = sbx.id;

  try {
    const containerName = "projects";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const prefix = `${projectId}/`;

    console.log("prefix : ", prefix);

    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      // Remove projectId prefix to get relative path
      const relativePath = blob.name.replace(prefix, "");

      // Download blob content
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      const downloadResponse = await blockBlobClient.download();
      const downloaded = await streamToString(downloadResponse.readableStreamBody!);

      await writeFileToSandbox(relativePath, downloaded, sbxId, projectId, user.id);

      console.log("writing : ", relativePath);
    }
    await runCommandInSandbox(`npm install`, sbxId, userId, projectId);
    await runCommandInSandbox(
      `bash -lc "setsid npm run dev -- --host 0.0.0.0 < /dev/null > dev.log 2>&1 & disown"`,
      sbxId,
      userId,
      projectId,
    );

    const host = VM_TO_HOST_PORT[sbx?.vmIp!];
    const url = `http://34.177.83.46:${host}`;

    return res.json({
      success: true,
      message: "Project Started Successfully",
      messages: project?.messages,
      projectId,
      url,
      sandboxId: sbxId,
    });
  } catch (error) {
    console.error("Error reading files:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to read files",
      details: null,
    });
  }
});

export default router;
