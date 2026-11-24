import { renderOg } from "@/lib/og";

export const dynamic = "force-static";

export function GET() {
  return renderOg("Christy Jacob", "Engineer. Writing about ML systems.");
}
