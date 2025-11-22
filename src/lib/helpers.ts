import axios from "axios";

export const writeFileToSandbox = async (
  path: string,
  content: string,
  id: string,
  projectId: string,
  userId: string,
) => {
  console.log("writing file : ", path);
  console.log("writing file for user: ", userId);
  const res = await axios.post("https://firecracker.pavitr.cloud/api/firecracker/exec/write", {
    id,
    path,
    content,
    projectId,
    userId,
  });

  return res.data.results;
};

export const runCommandInSandbox = async (command: string, id: string, userId: string, projectId: string) => {
  console.log("Trying to run command : ", command);
  const res = await axios.post("https://firecracker.pavitr.cloud/api/firecracker/exec/run", {
    command,
    id,
    userId,
    projectId,
  });

  return res.data.result;
};

export const createSandbox = async (userId: string) => {
  console.log("creating sandbox for userid: ", userId);
  const res = await axios.post("https://firecracker.pavitr.cloud/api/firecracker/create", {
    userId,
  });

  console.log("res : ", res.data.message);

  return res.data;
};

export const createDirInSandbox = async (path: string, userId: string, id: string) => {
  const res = await axios.post("https://firecracker.pavitr.cloud/api/firecracker/exec/create-dir", {
    userId,
    path,
    id,
  });
};

export const streamToString = async (readableStream: NodeJS.ReadableStream): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf-8"));
    });
    readableStream.on("error", reject);
  });
};

export const streamToBuffer = (readableStream: NodeJS.ReadableStream): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => chunks.push(data instanceof Buffer ? data : Buffer.from(data)));
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
};
