import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const USERS_PATH = path.join(process.cwd(), "data", "users.json");

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  image?: string;
};

type PublicUser = Pick<StoredUser, "id" | "name" | "email" | "image">;

export async function createUser(input: { name: string; email: string; password: string }): Promise<PublicUser> {
  const users = await readUsers();
  const email = normalizeEmail(input.email);

  if (users.some((user) => user.email === email)) {
    throw new Error("EMAIL_EXISTS");
  }

  const user: StoredUser = {
    id: randomBytes(12).toString("hex"),
    name: input.name.trim() || email.split("@")[0],
    email,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  await writeUsers([...users, user]);
  return toPublicUser(user);
}

export async function verifyUser(emailInput: string, password: string): Promise<PublicUser | null> {
  const users = await readUsers();
  const email = normalizeEmail(emailInput);
  const user = users.find((item) => item.email === email);

  if (!user) return null;
  const isValid = await verifyPassword(password, user.passwordHash);
  return isValid ? toPublicUser(user) : null;
}

function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

export async function updateUser(id: string, input: { name?: string; image?: string }): Promise<PublicUser> {
  const users = await readUsers();
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    throw new Error("USER_NOT_FOUND");
  }

  const updatedUser = {
    ...users[index],
    name: input.name !== undefined ? input.name.trim() : users[index].name,
    image: input.image !== undefined ? input.image : users[index].image,
  };

  users[index] = updatedUser;
  await writeUsers(users);
  return toPublicUser(updatedUser);
}

export async function getUserById(id: string): Promise<StoredUser | null> {
  const users = await readUsers();
  return users.find((user) => user.id === id) ?? null;
}


async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await readFile(USERS_PATH, "utf8");
    return JSON.parse(raw) as StoredUser[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeUsers(users: StoredUser[]) {
  await mkdir(path.dirname(USERS_PATH), { recursive: true });
  await writeFile(USERS_PATH, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;

  const storedKey = Buffer.from(keyHex, "hex");
  const inputKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return storedKey.length === inputKey.length && timingSafeEqual(storedKey, inputKey);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
