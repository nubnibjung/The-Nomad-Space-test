import { createUser } from "@/lib/userStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email.includes("@")) {
      return Response.json({ message: "กรุณากรอกอีเมลให้ถูกต้อง" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    const user = await createUser({ name, email, password });
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if ((error as Error).message === "EMAIL_EXISTS") {
      return Response.json({ message: "อีเมลนี้ลงทะเบียนไว้แล้ว" }, { status: 409 });
    }

    return Response.json({ message: "สมัครสมาชิกไม่สำเร็จ" }, { status: 500 });
  }
}
