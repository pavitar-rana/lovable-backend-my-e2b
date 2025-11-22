import { z } from "zod";
import { runCommandInSandbox, writeFileToSandbox } from "../lib/helpers.ts";
// import { tool } from "ai";
import { tool } from "langchain";

export const updateCreateFile = (sbxId: string, projectId: string, userId: string, emit: any) => {
  return tool(
    async ({ location, content }: { location: string; content: string }) => {
      console.log("=".repeat(80));
      console.log("UPDATE/CREATE FILE CALLED");
      console.log("=".repeat(80));
      console.log("Path:", location);
      console.log("-".repeat(80));
      console.log("Content:");
      console.log("-".repeat(80));
      console.log(content);
      console.log("=".repeat(80));
      await writeFileToSandbox(location, content, sbxId, projectId, userId);
      emit("tool:updateFile", { name: "updateFile", location });
      return `File updated`;
    },
    {
      name: "update_or_create_file",
      description: "Update or create a file in a directory",
      schema: z.object({
        location: z.string().describe("relative path of the file"),
        content: z.string().describe("relative path of the file"),
      }),
    },
  );
};

export const runCommand = (sbxId: string, projectId: string, userId: string, emit: any) => {
  return tool(
    async ({ command }: { command: string }) => {
      await runCommandInSandbox(command, sbxId, userId, projectId);
      emit("tool:runCommand", { name: "runCommand", command });
      return `Command executed successfully`;
    },
    {
      name: "run_command",
      description: "Run any command in terminal",
      schema: z.object({
        command: z.string().describe("Command to run in the terminal"),
      }),
    },
  );
};

// export const updateCreateFile = (sbxId: string, projectId: string, userId: string, emit: any) => {
//   return tool({
//     description: "Update a file at a certain directory",
//     inputSchema: z.object({
//       location: z.string().describe("Relative path to the file with filename and extension"),
//       content: z.string().describe("Content of the file"),
//     }),
//     execute: async ({ location, content }: { location: string; content: string }) => {
//       console.log("Tool got user id ", userId);
//       console.log("Tool got location ", location);
//       await writeFileToSandbox(location, content, sbxId, projectId, userId);
//       emit("tool:updateFile", { name: "updateFile", location });
//       return `File updated`;
//     },
//   });
// };
// export const runCommand = (sbxId: string, projectId: string, userId: string, emit: any) => {
//   return tool({
//     description: "Run a command in terminal",
//     inputSchema: z.object({
//       command: z.string().describe("Command to run in the terminal"),
//     }),
//     execute: async ({ command }: { command: string }) => {
//       console.log("Tool called : ", { command });

//       const result = runCommandInSandbox(command, sbxId, userId, projectId);
//       emit("tool:runCommand", { name: "runCommand", command });

//       console.log("runCommand result: ", result);
//       return `Command executed successfully`;
//     },
//   });
// };

// export const readFile = (sbx: any) => {
//   return {
//     description: "Read a file at a certain directory",
//     inputSchema: z.object({
//       location: z.string().describe("Relative path to the file"),
//     }),
//     execute: async ({ location }: { location: string }) => {
//       const fileContent = await sbx.files.read(location);

//       return fileContent;
//     },
//   };
// };
