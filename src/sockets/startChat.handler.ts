import { streamText } from "ai";
import { blobServiceClient } from "../config/azureBlob.ts";
import { CreateTreeFile } from "../helper/create-tree-file.ts";
import { createDirInSandbox, createSandbox, runCommandInSandbox } from "../lib/helpers.ts";
import { prisma } from "../lib/prisma.ts";
import { SYSTEM_PROMPT } from "../prompt.ts";
import { google } from "@ai-sdk/google";
import { updateFile } from "../tools/index.ts";
import { VM_TO_HOST_PORT } from "../lib/constants.ts";
import { UserValidatorSocket } from "../validators/db.validators.ts";

const startChatHandler = (io, socket) => {
  socket.on("startChat", async ({ prompt, messages, sandboxId, userId, projectId }) => {
    console.log("starting chat....");
    try {
      socket.join(userId);

      const user = await UserValidatorSocket(userId, io);

      if (!user) return;

      let project = await prisma.project.findUnique({
        where: {
          userId,
          id: projectId,
        },
      });

      if (!project) {
        console.log("creating project for : ", projectId);
        project = await prisma.project.create({
          data: {
            id: projectId,
            name: "My App",
            userId: user.id,
          },
        });
      }

      await prisma.message.create({
        data: {
          projectId: project.id,
          role: "user",
          content: prompt,
        },
      });

      console.log("starting chat for : ", project.id);

      let sbxId = sandboxId;

      let sbx = await prisma.virtualmachine.findUnique({
        where: {
          id: sbxId,
        },
      });

      console.log("Id for start chat for sandbox : ", sbxId);

      if (!sandboxId && project.id && !sbx) {
        sbx = await createSandbox(userId);

        sbxId = sbx?.id;

        console.log(`creating directory for path : /root/${project.id}`);
        await createDirInSandbox(`/root/${project.id}`, userId, sbxId);
        await runCommandInSandbox(
          `yes 'no' | npm create vite@latest . -- --template react && npm install && npm install lucide-react && npm install -D tailwindcss@3 postcss autoprefixer`,
          sbxId,
          userId,
          projectId,
        );

        await runCommandInSandbox(`npx tailwindcss init -p`, sbxId, userId, projectId);

        await runCommandInSandbox(
          `cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF`,
          sbxId,
          userId,
          projectId,
        );

        await runCommandInSandbox(
          `cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF`,
          sbxId,
          userId,
          projectId,
        );
        await runCommandInSandbox(
          `bash -lc "setsid npm run dev -- --host 0.0.0.0 < /dev/null > dev.log 2>&1 & disown"`,
          sbxId,
          userId,
          projectId,
        );
      }

      const host = VM_TO_HOST_PORT[sbx?.vmIp!];
      const url = `http://34.177.83.46:${host}`;

      new Promise((r) => setTimeout(r, 2000));
      io.to(userId).emit("sandbox:connected", { sandboxId: sbxId, url });

      const emit = (event: string, data: any) => io.to(userId).emit(event, data);

      const response = streamText({
        model: google("gemini-2.5-pro"),
        system: SYSTEM_PROMPT,
        toolChoice: "required",
        tools: {
          updateFile: updateFile(sbxId, projectId, user.id, emit),
        },
        messages,
        maxRetries: 0,
        // stopWhen: stepCountIs(1),
      });

      console.log("sandboxId : ", sandboxId);
      if (await response.content) {
        await runCommandInSandbox("npm install", sbxId, userId, projectId);
        await CreateTreeFile(sbxId, projectId, userId);
      }

      await prisma.message.create({
        data: {
          projectId: project.id,
          role: "assistant",
          content: JSON.stringify(await response.content, null, 2),
        },
      });

      emit("ai:done", {
        url,
        projectId: project.id,
        sandboxId: sbxId,
        messages: [
          ...messages,
          {
            role: "assistant",
            content: JSON.stringify(await response.content, null, 2),
          },
        ],
      });
      try {
        await CreateTreeFile(sbxId, projectId, userId);
        await new Promise((r) => setTimeout(r, 2000));
        const execution = await runCommandInSandbox("node getTree.js", sbxId, userId, projectId);
        const result = JSON.parse(execution);

        // console.log("result of getting all files : ", result)
        console.log("Starting syncing for project : ", projectId);

        const containerName = "projects";
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();
        const uploadPromises = result.files.map(async (file: any) => {
          const blobName = `${projectId}/${file.path}`.replace(/\\/g, "/");
          console.log(`Uploading file: ${blobName}`);
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          const buffer = Buffer.from(file.code, "utf-8");

          await blockBlobClient.upload(buffer, buffer.length, {
            blobHTTPHeaders: { blobContentType: file.type || "text/plain" },
          });
          console.log(`Successfully uploaded: ${blobName}`); // Log after upload
        });

        await Promise.all(uploadPromises);

        io.to(userId).emit("sync:status", { message: "Sync process completed successfully." });

        io.to(userId).emit("sync:complete", {
          files: result.files,
          tree: result.tree,
        });
      } catch (syncError) {
        console.error("Error auto-syncing files:", syncError);
        io.to(userId).emit("sync:error", { message: syncError.message });
      }
    } catch (err) {
      console.error("Error:", err);
      io.to(userId).emit("error", { message: err.message });
    }
  });
};

export default startChatHandler;
