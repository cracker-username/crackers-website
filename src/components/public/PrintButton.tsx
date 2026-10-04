"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "../ui/Button";

export function PrintButton() {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      onClick={() => window.print()}
      className="gap-2 print:hidden cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      Print / Save PDF
    </Button>
  );
}
