import type { NextApiRequest, NextApiResponse } from "next";
import { fetchCompanyInfo, fetchExchangeRate } from "@/lib/settings";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const [companyInfo, exchangeRate] = await Promise.all([
    fetchCompanyInfo(),
    fetchExchangeRate(),
  ]);
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json({ companyInfo, exchangeRate });
}
