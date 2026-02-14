"use client"

import { Button } from "@/components/ui/button"
import { Download, Printer, Edit, FileText } from "lucide-react"
import Link from "next/link"

interface BiltyActionsProps {
  biltyId: string
  biltyNo: string | number
}

export function BiltyActions({ biltyId, biltyNo }: BiltyActionsProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/bilty/${biltyId}/pdf`;
    link.download = `bilty_${biltyNo}_3copies.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handlePrint = () => {
    const win = window.open(`/api/bilty/${biltyId}/pdf`, '_blank');
    if (win) {
      win.onload = () => win.print();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/bilty/edit/${biltyId}`}>
        <Button variant="outline" size="sm" className="hover:bg-blue-50">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </Link>
      <a
        href={`/api/bilty/${biltyId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" size="sm" className="hover:bg-green-50">
          <FileText className="h-4 w-4 mr-2" />
          View PDF
        </Button>
      </a>
      <Button
        variant="default"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
        onClick={handleDownload}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="hover:bg-yellow-50"
        onClick={handlePrint}
      >
        <Printer className="h-4 w-4 mr-2" />
        Print
      </Button>
    </div>
  )
}