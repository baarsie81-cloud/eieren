import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

async function readPassword() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString("utf8").trim();
  }

  process.stdout.write("Wachtwoord: ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  return await new Promise((resolve, reject) => {
    let password = "";
    process.stdin.on("data", (key) => {
      if (key === "\u0003") {
        process.stdin.setRawMode(false);
        reject(new Error("Afgebroken"));
        return;
      }
      if (key === "\r" || key === "\n") {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(password);
        return;
      }
      if (key === "\u007f") {
        password = password.slice(0, -1);
        return;
      }
      password += key;
    });
  });
}

const password = await readPassword();
if (password.length < 10) {
  throw new Error("Gebruik minimaal 10 tekens.");
}

const salt = randomBytes(16);
const digest = await scrypt(password, salt, 64);
process.stdout.write(`scrypt:${salt.toString("base64url")}:${Buffer.from(digest).toString("base64url")}\n`);
