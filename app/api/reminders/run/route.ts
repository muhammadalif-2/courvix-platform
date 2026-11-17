import { settings, hash, ApiError, json, failure, audit } from "@/lib/v1";
import { processReminders } from "@/lib/reminders";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const expected = settings().COURVIX_REMINDER_JOB_KEY,
      key = req.headers.get("x-courvix-job-key");
    if (!expected || !key || (await hash(key)) !== (await hash(expected)))
      throw new ApiError(401, "Scheduler authorization is required.");
    const result = await processReminders();
    await audit(
      "platform",
      "scheduler",
      "Reminder scheduler run",
      JSON.stringify({ status: "Completed", ...result }),
    );
    return json({ ok: true, ...result });
  } catch (e) {
    return failure(e);
  }
}
