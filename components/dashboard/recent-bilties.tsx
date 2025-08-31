import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, Edit, Download } from "lucide-react"
import { getRecentBilties } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

export async function RecentBilties() {
  const bilties = await getRecentBilties(5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Bilties</CardTitle>
          <CardDescription>Latest bilty documents</CardDescription>
        </div>
        <Link href="/bilty/view">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bilties.map((bilty) => {
            const biltyDate =
              bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)

            return (
              <div
                key={bilty.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">Bilty #{bilty.biltyNo}</p>
                      <p className="text-sm text-muted-foreground">{biltyDate.toLocaleDateString()}</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm">
                        {bilty.consignorName} → {bilty.consigneeName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {bilty.from} to {bilty.to}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
