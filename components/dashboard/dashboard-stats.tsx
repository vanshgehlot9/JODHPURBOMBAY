import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from "lucide-react"
import { getDashboardStats } from "@/lib/firestore"

export async function DashboardStats() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: "Today's Sales",
      value: stats.todaySales,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Last 7 Days",
      value: stats.last7Days,
      icon: Calendar,
      color: "text-blue-600",
    },
    {
      title: "Last 30 Days",
      value: stats.last30Days,
      icon: CalendarDays,
      color: "text-purple-600",
    },
    {
      title: "Last 90 Days",
      value: stats.last90Days,
      icon: CalendarRange,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">Bilties processed</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
