export async function GET() {
  return Response.json({
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
    configured: Boolean(process.env.GEMINI_API_KEY),
  });
}
