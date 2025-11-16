import { tool } from "ai";
import { z } from "zod";
import { runCommandInSandbox, writeFileToSandbox } from "../lib/helpers.ts";

export const updateFile = (sbxId: string, projectId: string, userId: string, emit: any) => {
  return tool({
    description: "Update a file at a certain directory",
    inputSchema: z.object({
      location: z.string().describe("Relative path to the file with filename and extension"),
      content: z.string().describe("Content of the file"),
    }),
    execute: async ({ location, content }: { location: string; content: string }) => {
      console.log("Tool got user id ", userId);
      console.log("Tool got location ", location);
      await writeFileToSandbox(location, content, sbxId, projectId, userId);
      emit("tool:updateFile", { name: "updateFile", location });
      return `File updated`;
    },
  });
};
export const runCommand = (sbxId: string, projectId: string, userId: string, emit: any) => {
  return tool({
    description: "Run a command in terminal",
    inputSchema: z.object({
      command: z.string().describe("Command to run in the terminal"),
    }),
    execute: async ({ command }: { command: string }) => {
      console.log("Tool called : ", { command });

      const result = runCommandInSandbox(command, sbxId, userId, projectId);
      emit("tool:runCommand", { name: "runCommand", command });

      console.log("runCommand result: ", result);
      return `Command executed successfully`;
    },
  });
};

export const readFile = (sbx: any) => {
  return {
    description: "Read a file at a certain directory",
    inputSchema: z.object({
      location: z.string().describe("Relative path to the file"),
    }),
    execute: async ({ location }: { location: string }) => {
      const fileContent = await sbx.files.read(location);

      return fileContent;
    },
  };
};
