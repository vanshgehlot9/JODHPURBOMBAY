"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  X,
  Calendar,
  FileText,
  Loader2,
  Database,
  ArrowRight,
  CheckCircle2,
  Truck,
  ScrollText,
  Landmark
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ExportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reportType: "bilty",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { startDate, endDate, reportType } = formData;
      const url = `/api/bilty/export?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}`;

      let filename = "report.xlsx";
      if (reportType === "financial") filename = "gst_report.xlsx";
      else if (reportType === "bilty") filename = "bilty_report.xlsx";
      else if (reportType === "ewayBill") filename = "ewaybill_report.xlsx";

      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }, 100);

      toast({
        title: "Success",
        description: "Report exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      startDate: "",
      endDate: "",
      reportType: "bilty",
    });
  };

  const ReportTypeCard = ({
    id,
    icon: Icon,
    title,
    desc,
    active
  }: {
    id: string;
    icon: any;
    title: string;
    desc: string;
    active: boolean
  }) => (
    <div
      onClick={() => setFormData(prev => ({ ...prev, reportType: id }))}
      className={cn(
        "relative group cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 ease-in-out",
        active
          ? "bg-[#1E1B4B]/5 border-[#1E1B4B] shadow-sm"
          : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      <div className={cn(
        "absolute top-3 right-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
        active ? "border-[#1E1B4B] bg-[#1E1B4B]" : "border-gray-200"
      )}>
        {active && <CheckCircle2 className="h-3 w-3 text-white" />}
      </div>

      <div className="flex flex-col gap-3">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
          active ? "bg-[#1E1B4B] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className={cn("font-bold text-sm", active ? "text-[#1E1B4B]" : "text-gray-700")}>{title}</h3>
          <p className="text-xs text-gray-500 mt-1 leading-snug">{desc}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 font-sans">
        <Header title="Data Export" subtitle="Download comprehensive records for external use" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full flex items-center justify-center relative overflow-hidden">

          {/* Subtle aesthetic background elements */}
          <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-900 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900 rounded-full blur-3xl"></div>
          </div>

          <div className="w-full max-w-4xl relative z-10">
            <Card className="shadow-2xl shadow-indigo-900/10 border-0 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/50">
              <div className="grid grid-cols-1 lg:grid-cols-5 h-full">

                {/* Left Side: Hero / Info (Desktop Only) */}
                <div className="hidden lg:flex lg:col-span-2 bg-[#1E1B4B] p-10 flex-col justify-between relative overflow-hidden text-white">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                  <div className="absolute -right-20 -bottom-20 opacity-10">
                    <Database className="h-80 w-80" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                      <FileSpreadsheet className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black tracking-tight leading-tight">Export<br />Terminal</h2>
                      <p className="text-indigo-200 mt-4 text-sm leading-relaxed">
                        Generate secure, audit-ready Excel reports for your operational and financial records.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3 text-xs font-medium text-indigo-200 bg-white/5 p-3 rounded-xl border border-white/5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Format: .xlsx (Excel)</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-indigo-200 bg-white/5 p-3 rounded-xl border border-white/5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Secure Data Pipeline</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Form */}
                <div className="lg:col-span-3 p-8 sm:p-10 lg:p-12">
                  <form onSubmit={handleSubmit} className="space-y-8 h-full flex flex-col justify-center">

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Select Data Source</Label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ReportTypeCard
                          id="bilty"
                          icon={Truck}
                          title="Bilty"
                          desc="Transport receipts & tracking"
                          active={formData.reportType === "bilty"}
                        />
                        <ReportTypeCard
                          id="ewayBill"
                          icon={ScrollText}
                          title="E-way Bill"
                          desc="Government compliance data"
                          active={formData.reportType === "ewayBill"}
                        />
                        <ReportTypeCard
                          id="financial"
                          icon={Landmark}
                          title="Financial"
                          desc="GST & Account ledgers"
                          active={formData.reportType === "financial"}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Date Range Pattern</Label>
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="relative group w-full">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-[#1E1B4B] transition-colors" />
                          </div>
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                            required
                            className="pl-12 h-14 bg-gray-50 border-gray-100 focus:bg-white focus:border-[#1E1B4B] focus:ring-0 rounded-2xl text-base font-medium transition-all"
                          />
                        </div>
                        <div className="text-gray-300">
                          <ArrowRight className="h-5 w-5" />
                        </div>
                        <div className="relative group w-full">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-[#1E1B4B] transition-colors" />
                          </div>
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                            required
                            className="pl-12 h-14 bg-gray-50 border-gray-100 focus:bg-white focus:border-[#1E1B4B] focus:ring-0 rounded-2xl text-base font-medium transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex flex-col-reverse sm:flex-row gap-4">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        className="h-14 px-8 rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 h-14 bg-[#1E1B4B] hover:bg-[#2A2665] text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative flex items-center justify-center">
                          {loading ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="h-5 w-5 mr-2" />
                              Download Report
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
