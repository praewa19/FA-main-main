import { rm } from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data");

await rm(dataPath, { recursive: true, force: true });
console.log("Local data store removed. It will be recreated on the next app request.");
