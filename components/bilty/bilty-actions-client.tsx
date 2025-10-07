"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit3, Eye, Printer, Download } from "lucide-react"

interface BiltyActionsProps {
  biltyId: string
}

export function BiltyActionsClient({ biltyId }: BiltyActionsProps) {
  const handlePrint = () => {
    const win = window.open(`/api/bilty/${biltyId}/pdf`, '_blank');
    if (win) {
      win.onload = () => win.print();
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = `/api/bilty/${biltyId}/pdf`
    link.download = `bilty-${biltyId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/bilty/edit/${biltyId}`}>
        <Button variant="outline" className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
          <Edit3 className="h-4 w-4" />
          Edit Bilty
        </Button>
      </Link>
      
      <a
        href={`/api/bilty/${biltyId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300 hover:text-green-700">
          <Eye className="h-4 w-4" />
          View PDF
        </Button>
      </a>
      
      <Button 
        variant="outline" 
        onClick={handleDownload}
        className="flex items-center gap-2 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      
      <Button 
        variant="default" 
        onClick={handlePrint}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        <Printer className="h-4 w-4" />
        Print PDF
      </Button>
    </div>
  )
}