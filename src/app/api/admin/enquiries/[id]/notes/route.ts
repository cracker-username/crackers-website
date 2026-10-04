import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAdminAuth } from "@/lib/auth/session";
import { z } from "zod";

const NoteSchema = z.object({
  content: z.string().trim().min(1, "Note content cannot be empty").max(2000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = NoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "VALIDATION_ERROR", message: "Invalid note content", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { content } = parsed.data;

  const result = await withAdminAuth("ENQUIRIES_EDIT", async (session) => {
    const note = await prisma.enquiryNote.create({
      data: {
        enquiryId: id,
        authorId: session.user.id,
        content,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return note;
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
