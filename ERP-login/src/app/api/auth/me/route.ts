import { NextResponse } from "next/server";
import { getUser, getUserWithPermissions } from "@/lib/auth-server";
import { recordAuthEvent } from "@/lib/audit-log";
import { extractIp } from "@/lib/rate-limit";

export async function GET() {
  const user = await getUserWithPermissions();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", { maxAge: 0, path: "/" });
  if (user) {
    await recordAuthEvent({
      userId: user.id,
      action: "LOGOUT",
      result: "SUCCESS",
      ip: extractIp(request),
      userAgent: request.headers.get("user-agent"),
    });
  }
  return response;
}
