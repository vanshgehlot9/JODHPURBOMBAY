import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, CalendarDays, CalendarRange, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getDashboardStats } from "@/lib/firestore"

export async function DashboardStats() {
  const stats = await getDashboardStats()

  const statCards = [
    {
      title: "Today's Sales",
      value: stats.todaySales,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      ringColor: "ring-green-200/50",
      gradient: "from-green-500 to-emerald-600",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Last 7 Days",
      value: stats.last7Days,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      ringColor: "ring-blue-200/50",
      gradient: "from-blue-500 to-indigo-600",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Last 30 Days",
      value: stats.last30Days,
      icon: CalendarDays,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      ringColor: "ring-purple-200/50",
      gradient: "from-purple-500 to-pink-600",
      trend: "+15%",
      trendUp: true,
    },
    {
      title: "Last 90 Days",
      value: stats.last90Days,
      icon: CalendarRange,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      ringColor: "ring-orange-200/50",
      gradient: "from-orange-500 to-red-600",
      trend: "+5%",
      trendUp: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {statCards.map((stat, index) => (
        <Card 
          key={index} 
          className={`group relative overflow-hidden border-0 ring-1 ${stat.ringColor} hover-lift transition-all duration-300 animate-in`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Gradient background on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
          
          {/* Animated circle decoration */}
          <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${stat.bgColor} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
              {stat.title}
            </CardTitle>
            <div className={`h-10 w-10 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <p className="text-xs text-gray-500 font-medium">Bilties processed</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stat.bgColor}`}>
                {stat.trendUp ? (
                  <ArrowUpRight className={`h-3 w-3 ${stat.color}`} />
                ) : (
                  <ArrowDownRight className={`h-3 w-3 ${stat.color}`} />
                )}
                <span className={`text-xs font-semibold ${stat.color}`}>{stat.trend}</span>
              </div>
            </div>
          </CardContent>
          
          {/* Bottom gradient accent */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
        </Card>
      ))}
    </div>
  )
}
