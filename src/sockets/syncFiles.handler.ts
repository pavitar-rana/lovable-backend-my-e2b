import { blobServiceClient } from "../config/azureBlob.ts";
import { CreateTreeFile } from "../helper/create-tree-file.ts";
import { runCommandInSandbox } from "../lib/helpers.ts";
import { ProjectValidatorSocket, UserValidatorSocket } from "../validators/db.validators.ts";

const syncFilesHandler = (io, socket) => {
  socket.on("syncFiles", async ({ sandboxId, userId, projectId }) => {
    console.log("syncing files....");
    try {
      socket.join(userId);

      await UserValidatorSocket(userId, io);
      await ProjectValidatorSocket(userId, projectId, io);

      if (!sandboxId) {
        io.to(userId).emit("sync:error", { message: "Sandbox Id needed" });
        return;
      }

      await CreateTreeFile(sandboxId, projectId, userId);

      // const execution = await sbx.commands.run("node /tmp/getTree.js");
      const execution = await runCommandInSandbox("node /tmp/getTree.js", sandboxId, userId, projectId);
      const result = execution;

      // console.log("result of getting all files : ", result);

      const containerName = "projects";
      const containerClient = blobServiceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();

      const uploadPromises = result.files.map(async (file: any) => {
        const blobName = `${projectId}/${file.path}`.replace(/\\/g, "/");

        console.log("blobName : ", blobName);

        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const buffer = Buffer.from(file.code, "utf-8");

        await blockBlobClient.upload(buffer, buffer.length, {
          blobHTTPHeaders: { blobContentType: file.type || "text/plain" },
        });
      });

      await Promise.all(uploadPromises);

      io.to(userId).emit("sync:complete", {
        files: result.files,
        tree: result.tree,
      });
    } catch (err) {
      console.error("Error syncing files:", err);
      io.to(userId).emit("sync:error", { message: err.message });
    }
  });
};

export default syncFilesHandler;
