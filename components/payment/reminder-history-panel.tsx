"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { getReminderHistory, ReminderHistory } from "@/lib/firestore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ReminderHistoryPanel() {
    const [history, setHistory] = useState<ReminderHistory[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const loadHistory = async () => {
        setLoading(true)
        try {
            const data = await getReminderHistory(50) // Fetch last 50
            setHistory(data)
        } catch (error) {
            console.error("Failed to load history", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    const filteredHistory = history.filter(item =>
        item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.message.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Sent</Badge>
            case 'failed':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'manual':
                return <Badge variant="secondary" className="text-xs">Manual</Badge>
            case 'scheduled':
                return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-xs">Auto</Badge>
            case 'bulk':
                return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 text-xs">Bulk</Badge>
            default:
                return <Badge variant="outline">{type}</Badge>
        }
    }

    return (
        <Card className="glass-card border-slate-200/60 shadow-sm">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-800">Transmission Logs</CardTitle>
                        <CardDescription>History of all payment reminders sent</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadHistory} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by customer name or message..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white/50"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-slate-100 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        Loading logs...
                                    </TableCell>
                                </TableRow>
                            ) : filteredHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                                        No logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredHistory.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                                        <TableCell className="text-xs text-slate-500 font-mono">
                                            {item.sentAt ? format(item.sentAt instanceof Date ? item.sentAt : item.sentAt.toDate(), "dd MMM HH:mm") : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-700">{item.partyName}</TableCell>
                                        <TableCell>{getTypeBadge(item.type)}</TableCell>
                                        <TableCell className="font-mono">₹{item.amount.toLocaleString()}</TableCell>
                                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
