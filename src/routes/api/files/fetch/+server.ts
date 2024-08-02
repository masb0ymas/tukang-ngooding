import { json } from "@sveltejs/kit";
import path from "path";
import { promises as fs } from "fs";
import { supportedExtensions, resolveAndValidateFilePath } from "$lib/+serverUtils.js";

export async function GET(request) {
  const url = new URL(request.url);
  const filePath = url.searchParams.get("file");

  if (!filePath) {
    return json(
      { error: "File path is required" },
      { status: 400 }
    );
  }

  try {
    const encodedFilePath = decodeURIComponent(filePath);
    const fullPath = await resolveAndValidateFilePath(encodedFilePath);

    const extension = path.extname(fullPath).slice(1).toLowerCase();

    // Check if the file extension is supported
    if (!(extension in supportedExtensions)) {
      return json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }

    // Read the file contents
    const content = await fs.readFile(fullPath, "utf-8");

    return json({
      content,
      language: supportedExtensions[extension],
      name: path.basename(fullPath),
      extension
    });
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return json(
        { error: "File not found" },
        { status: 404 }
      );
    }
    return json(
      { error: error.message },
      { status: 500 }
    );
  }
}