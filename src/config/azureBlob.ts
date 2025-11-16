import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import dotenv from "dotenv";

dotenv.config();

const accountName = process.env.AZURE_STORAGE_ACCOUNT;
const accountKey = process.env.AZURE_STORAGE_KEY;

if (!accountName || !accountKey) {
  throw new Error("Azure storage environment variables are missing.");
}

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

export const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential,
);
