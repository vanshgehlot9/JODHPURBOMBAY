"use client"

import { useState, useEffect } from "react"
import { getAllParties, Party, logReminderHistory } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle, Circle, Play, Send, ChevronRight, RotateCcw, MessageSquare, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function BulkReminderPanel() {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [parties, setParties] = useState<Party[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [message, setMessage] = useState("Dear Customer, gentle reminder regarding your pending payment. Please clear it at the earliest. - JBRC Logistics")
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Execution State
    const [currentIndex, setCurrentIndex] = useState(0)
    const [processingLog, setProcessingLog] = useState<{ name: string, status: 'pending' | 'sent' | 'skipped' }[]>([])

    const { toast } = useToast()

    useEffect(() => {
        loadParties()
    }, [])

    const loadParties = async () => {
        setLoading(true)
        try {
            const data = await getAllParties()
            // Sort by Name
            setParties(data.sort((a, b) => a.name.localeCompare(b.name)))
        } catch (error) {
            toast({ title: "Error", description: "Failed to load parties", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const filteredParties = parties.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
    )

    const toggleAll = () => {
        if (selectedIds.size === filteredParties.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredParties.map(p => p.id!)))
        }
    }

    const handleStartProcessing = () => {
        if (selectedIds.size === 0) return
        const selectedParties = parties.filter(p => selectedIds.has(p.id!))
        setProcessingLog(selectedParties.map(p => ({ name: p.name, status: 'pending' })))
        setStep(3)
        setCurrentIndex(0)
    }

    const getCurrentParty = () => {
        const selectedParties = parties.filter(p => selectedIds.has(p.id!))
        return selectedParties[currentIndex]
    }

    const sendCurrent = async () => {
        const party = getCurrentParty()
        if (!party) return

        // Construct WhatsApp URL
        const encodedMessage = encodeURIComponent(message)
        const phone = party.phone?.replace(/\D/g, '') || ''

        // Log intent to send (even if user cancels in WhatsApp, we assume intent)
        // In a real app, maybe wait for user confirmation
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')

        // We will ask for confirmation
    }

    const markProcessed = async (status: 'sent' | 'skipped') => {
        const party = getCurrentParty()

        // Log to history if sent
        if (status === 'sent') {
            try {
                await logReminderHistory({
                    partyName: party.name,
                    phoneNumber: party.phone || 'N/A',
                    amount: 0, // Amount is unknown in bulk mode without ledger
                    message: message,
                    status: 'sent',
                    type: 'bulk'
                })
            } catch (e) {
                console.error("Failed to log history", e)
            }
        }

        // Update log UI
        const newLog = [...processingLog]
        newLog[currentIndex] = { ...newLog[currentIndex], status }
        setProcessingLog(newLog)

        // Move to next
        if (currentIndex < selectedIds.size - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            toast({ title: "Batch Complete", description: "All reminders processed" })
        }
    }

    const reset = () => {
        setStep(1)
        setSelectedIds(new Set())
        setCurrentIndex(0)
        setProcessingLog([])
    }

    return (
        <div className="space-y-6">
            {/* Progress Stepper */}
            <div className="flex items-center justify-between px-10 mb-8 relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10" />
                <div className={cn("flex flex-col items-center gap-2 bg-gray-50 px-2 z-10", step >= 1 ? "text-blue-600" : "text-slate-400")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step >= 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500")}>1</div>
                    <span className="text-xs font-semibold uppercase tracking-wider">Select</span>
                </div>
                <div className={cn("flex flex-col items-center gap-2 bg-gray-50 px-2 z-10", step >= 2 ? "text-blue-600" : "text-slate-400")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step >= 2 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500")}>2</div>
                    <span className="text-xs font-semibold uppercase tracking-wider">Configure</span>
                </div>
                <div className={cn("flex flex-col items-center gap-2 bg-gray-50 px-2 z-10", step >= 3 ? "text-blue-600" : "text-slate-400")}>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm", step >= 3 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500")}>3</div>
                    <span className="text-xs font-semibold uppercase tracking-wider">Run Batch</span>
                </div>
            </div>

            {step === 1 && (
                <Card className="glass-card border-slate-200/60">
                    <CardHeader>
                        <CardTitle>Select Recipients</CardTitle>
                        <CardDescription>Choose who should receive a payment reminder</CardDescription>
                        <div className="pt-2">
                            <Input
                                placeholder="Search parties..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-md"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md h-[400px] flex flex-col">
                            <div className="p-3 border-b bg-slate-50/50 flex items-center gap-3">
                                <Checkbox
                                    checked={selectedIds.size > 0 && selectedIds.size === filteredParties.length}
                                    onCheckedChange={toggleAll}
                                />
                                <span className="text-sm font-semibold text-slate-600">Select All ({filteredParties.length})</span>
                                <div className="ml-auto">
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                        {selectedIds.size} Selected
                                    </Badge>
                                </div>
                            </div>
                            <ScrollArea className="flex-1">
                                {filteredParties.map((party) => (
                                    <div key={party.id} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <Checkbox
                                            checked={selectedIds.has(party.id!)}
                                            onCheckedChange={() => toggleSelection(party.id!)}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900">{party.name}</p>
                                            <p className="text-xs text-slate-500">{party.phone || "No phone linked"}</p>
                                        </div>
                                        {party.type && <Badge variant="outline" className="text-[10px] uppercase">{party.type}</Badge>}
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button onClick={() => setStep(2)} disabled={selectedIds.size === 0} className="bg-blue-600 hover:bg-blue-700">
                            Next Step <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 2 && (
                <Card className="glass-card border-slate-200/60 max-w-2xl mx-auto">
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>This message will be sent to all {selectedIds.size} selected parties.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Reminder Message</Label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="resize-none font-mono text-sm leading-relaxed"
                            />
                            <p className="text-xs text-slate-500">
                                Note: This will open WhatsApp Web/App for each contact sequentially.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={handleStartProcessing} className="bg-blue-600 hover:bg-blue-700">
                            Start Bulk Send <Play className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {step === 3 && (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Task */}
                    <Card className="glass-card border-slate-200/60 md:col-span-1 h-fit">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 pb-6 border-b border-indigo-100">
                            <div className="flex justify-between items-start mb-2">
                                <Badge className="bg-blue-600 hover:bg-blue-700">
                                    Processing {currentIndex + 1} of {selectedIds.size}
                                </Badge>
                            </div>
                            {getCurrentParty() ? (
                                <>
                                    <CardTitle className="text-2xl font-bold text-slate-900">{getCurrentParty().name}</CardTitle>
                                    <CardDescription className="text-slate-600 font-medium font-mono mt-1">
                                        {getCurrentParty().phone || 'No Phone Number'}
                                    </CardDescription>
                                </>
                            ) : (
                                <CardTitle className="text-xl text-green-600">All Done! 🎉</CardTitle>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6">
                            {getCurrentParty() ? (
                                <div className="space-y-6">
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Message Preview</p>
                                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{message}</p>
                                    </div>

                                    <Button
                                        className="w-full h-12 text-lg bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-green-500/20"
                                        onClick={sendCurrent}
                                    >
                                        <Send className="mr-2 h-5 w-5" /> Open WhatsApp
                                    </Button>

                                    <div className="space-y-3 pt-2">
                                        <p className="text-center text-sm font-medium text-slate-600">Did you start the chat?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" className="border-slate-200 hover:bg-slate-100" onClick={() => markProcessed('skipped')}>
                                                Skip / Failed
                                            </Button>
                                            <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => markProcessed('sent')}>
                                                Mark Sent & Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-slate-800">Batch Processing Complete</p>
                                    <Button onClick={reset} className="mt-6" variant="outline">
                                        <RotateCcw className="mr-2 h-4 w-4" /> Start New Batch
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Queue List */}
                    <Card className="glass-card border-slate-200/60 md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">Queue Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[500px]">
                                {processingLog.map((log, i) => (
                                    <div key={i} className={cn(
                                        "px-4 py-3 border-b flex items-center justify-between text-sm transition-colors",
                                        i === currentIndex ? "bg-blue-50 border-l-4 border-l-blue-600" : "",
                                        log.status === 'sent' ? "bg-green-50/50" : ""
                                    )}>
                                        <div className="flex items-center gap-3">
                                            {log.status === 'sent' ? (
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            ) : log.status === 'skipped' ? (
                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <Circle className={cn("h-4 w-4", i === currentIndex ? "text-blue-600 fill-blue-200" : "text-slate-200")} />
                                            )}
                                            <span className={cn(
                                                "font-medium",
                                                i === currentIndex ? "text-slate-900" : "text-slate-600",
                                                log.status !== 'pending' && "text-slate-400"
                                            )}>
                                                {log.name}
                                            </span>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] uppercase",
                                            log.status === 'sent' && "border-green-200 text-green-600 bg-green-50",
                                            log.status === 'skipped' && "border-amber-200 text-amber-600 bg-amber-50"
                                        )}>
                                            {log.status}
                                        </Badge>
                                    </div>
                                ))}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
