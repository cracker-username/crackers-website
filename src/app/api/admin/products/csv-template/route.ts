import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/auth/session";

export async function GET() {
  const result = await withAdminAuth("PRODUCTS_VIEW", async () => {
    const csvContent =
      "sku,name,categoryName,packSize,unit,mrpRupees,priceRupees,availability,isFeatured,isBestseller,shortDesc\n" +
      "SPK-DEMO-01,10cm Electric Sparklers,Sparklers,10 Pcs,Box,80,45,IN_STOCK,true,true,Crackling gold sparklers\n" +
      "FLW-DEMO-02,Special Flower Pots,Flower Pots,10 Pcs,Box,150,90,IN_STOCK,false,true,Vibrant silver shower\n";

    return csvContent;
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }

  return new NextResponse(result.data, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="products_template.csv"',
    },
  });
}
