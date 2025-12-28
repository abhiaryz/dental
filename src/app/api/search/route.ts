import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, AuthenticatedRequest } from "@/lib/auth-middleware";
import { cacheQuery, getCacheKey, CACHE_CONFIG } from "@/lib/query-cache";

// GET - Global search across invoices
export const GET = withAuth(
  async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const query = searchParams.get("query");

      if (!query || query.trim().length < 2) {
        return NextResponse.json({
          patients: [],
          invoices: [],
        });
      }

      const searchQuery = query.trim();

      // Cache search results (common queries benefit from caching)
      const cacheKey = getCacheKey('search', req.user.id, searchQuery);
      const result = await cacheQuery(
        cacheKey,
        async () => {
          // Search invoices
          const invoices = await prisma.invoice.findMany({
            where: {
              OR: [
                { invoiceNumber: { contains: searchQuery, mode: "insensitive" } },
              ],
            },
            take: 5,
            select: {
              id: true,
              invoiceNumber: true,
              totalAmount: true,
              status: true,
            },
            orderBy: { createdAt: "desc" },
          });

          return {
            patients: [],
            invoices,
          };
        },
        CACHE_CONFIG.SHORT, // 1 minute cache for search results
        [`search-${req.user.id}`]
      );

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error in global search:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
      );
    }
  }
);

