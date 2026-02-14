"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { getScheduledReminders, schedulePaymentReminder, updateReminderStatus, PaymentReminder } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { searchParties, Party } from "@/lib/firestore"

export function ScheduledReminderPanel() {
    const [reminders, setReminders] = useState<PaymentReminder[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { toast } = useToast()

    // New Reminder State
    const [partySearch, setPartySearch] = useState("")
    const [partySuggestions, setPartySuggestions] = useState<Party[]>([])
    const [selectedParty, setSelectedParty] = useState<Party | null>(null)
    const [amount, setAmount] = useState("")
    const [message, setMessage] = useState("Gentle reminder: Your payment is due. Please clear it at the earliest.")
    const [date, setDate] = useState<Date | undefined>(new Date())

    useEffect(() => {
        loadReminders()
    }, [])

    const loadReminders = async () => {
        setLoading(true)
        try {
            const data = await getScheduledReminders('pending')
            setReminders(data)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load scheduled reminders",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handlePartySearch = async (term: string) => {
        setPartySearch(term)
        if (term.length > 2) {
            const results = await searchParties(term)
            setPartySuggestions(results)
        } else {
            setPartySuggestions([])
        }
    }

    const selectParty = (party: Party) => {
        setSelectedParty(party)
        setPartySearch(party.name)
        setPartySuggestions([])
    }

    const handleSchedule = async () => {
        if (!selectedParty || !amount || !date) {
            toast({ title: "Missing Fields", description: "Please fill all required fields", variant: "destructive" })
            return
        }

        try {
            await schedulePaymentReminder({
                partyId: selectedParty.id,
                partyName: selectedParty.name,
                whatsappNumber: selectedParty.phone || "",
                amount: parseFloat(amount),
                message,
                scheduledDate: date,
                frequency: 'once'
            })

            toast({ title: "Scheduled", description: "Reminder scheduled successfully" })
            setIsDialogOpen(false)
            loadReminders()
            // Reset form
            setPartySearch("")
            setSelectedParty(null)
            setAmount("")
        } catch (error) {
            toast({ title: "Error", description: "Failed to schedule reminder", variant: "destructive" })
        }
    }

    const cancelReminder = async (id: string) => {
        try {
            await updateReminderStatus(id, 'cancelled')
            toast({ title: "Cancelled", description: "Reminder cancelled" })
            loadReminders()
        } catch (error) {
            toast({ title: "Error", description: "Failed to cancel reminder", variant: "destructive" })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-display font-bold text-slate-800">Upcoming Reminders</h3>
                    <p className="text-sm text-slate-500">Automated alerts queued for delivery</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                            <Plus className="mr-2 h-4 w-4" /> Schedule New
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] glass-card border-white/40">
                        <DialogHeader>
                            <DialogTitle>Schedule Payment Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="party">Customer</Label>
                                <div className="relative">
                                    <Input
                                        id="party"
                                        value={partySearch}
                                        onChange={(e) => handlePartySearch(e.target.value)}
                                        placeholder="Search customer..."
                                        className="focus:ring-blue-500"
                                    />
                                    {partySuggestions.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                            {partySuggestions.map(party => (
                                                <div
                                                    key={party.id}
                                                    className="p-2 hover:bg-slate-50 cursor-pointer text-sm"
                                                    onClick={() => selectParty(party)}
                                                >
                                                    {party.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Due Amount (₹)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Schedule Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSchedule} disabled={!selectedParty || !amount || !date}>
                                Confirm Schedule
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading schedule...</div>
            ) : reminders.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No active reminders scheduled</p>
                    <p className="text-slate-400 text-sm">Add one to automate your follow-ups</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reminders.map((reminder) => (
                        <Card key={reminder.id} className="glass-card hover:shadow-lg transition-all border-slate-200/60 group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg mb-2">
                                        {reminder.partyName.charAt(0)}
                                    </div>
                                    <div className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
                                        {reminder.frequency || 'Once'}
                                    </div>
                                </div>
                                <CardTitle className="text-base font-bold text-slate-800 truncate" title={reminder.partyName}>
                                    {reminder.partyName}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1 text-xs">
                                    <Clock className="h-3 w-3" />
                                    Scheduled: {reminder.scheduledDate ? format(reminder.scheduledDate instanceof Date ? reminder.scheduledDate : reminder.scheduledDate.toDate(), "MMM d, yyyy") : 'No Date'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Amount Due</p>
                                        <p className="text-xl font-display font-bold text-slate-900">₹{reminder.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 text-xs h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => cancelReminder(reminder.id!)}>
                                        <Trash2 className="h-3 w-3 mr-1" /> Cancel
                                    </Button>
                                    <Button className="flex-1 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
                                        Edit Info
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
