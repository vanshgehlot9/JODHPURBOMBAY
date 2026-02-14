'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Eye } from 'lucide-react';

export default function ViewChallan({ params }: { params: { id: string } }) {
  const [challanData, setChallanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallanData();
  }, []);

  const fetchChallanData = async () => {
    try {
      const response = await fetch(`/api/challan/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch challan data');
      }
      
      const data = await response.json();
      setChallanData(data);
    } catch (error) {
      console.error('Error fetching challan:', error);
      toast({
        title: "Error",
        description: "Failed to fetch challan data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/challan/${params.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `challan-${challanData?.challanNumber || params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const handleViewPdf = async () => {
    try {
      const response = await fetch(`/api/challan/${params.id}/pdf`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast({
        title: "Success",
        description: "PDF opened in new tab",
      });
    } catch (error) {
      console.error('Error viewing PDF:', error);
      toast({
        title: "Error",
        description: "Failed to view PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">Loading challan data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!challanData) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="text-center">Challan not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Challan Details</h1>
        <div className="space-x-2">
          <Button onClick={handleViewPdf} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            View PDF
          </Button>
          <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Challan #{challanData.challanNo}
            <Badge variant="secondary">
              {new Date(challanData.date).toLocaleDateString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Shipment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bilty Number:</span>
                    <span className="font-medium">{challanData.items?.[0]?.biltyNo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From:</span>
                    <span className="font-medium">{challanData.from}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">{challanData.to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Truck No:</span>
                    <span className="font-medium">{challanData.truckNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Truck Owner:</span>
                    <span className="font-medium">{challanData.truckOwnerName}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Party Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consignor:</span>
                    <span className="font-medium">{challanData.items?.[0]?.consignorName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consignee:</span>
                    <span className="font-medium">{challanData.items?.[0]?.consigneeName || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Goods Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bundle Name:</span>
                    <span className="font-medium">{challanData.items?.[0]?.description || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{challanData.items?.[0]?.quantity || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weight:</span>
                    <span className="font-medium">{challanData.items?.[0]?.weight || 0} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-medium">₹{challanData.items?.[0]?.rate || 0}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Amount Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Freight:</span>
                    <span className="font-medium">₹{challanData.items?.[0]?.freight || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Item Total:</span>
                    <span className="font-medium">₹{challanData.items?.[0]?.total || 0}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span>₹{challanData.totalFreight || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          {challanData.items && challanData.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Items Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Sr.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Bilty No.</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Consignor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Consignee</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Bundle Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Weight</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Freight</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {challanData.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{index + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{item.biltyNo}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{item.consignorName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{item.consigneeName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{item.description}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{item.quantity}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">{item.weight} kg</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b">₹{item.freight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
