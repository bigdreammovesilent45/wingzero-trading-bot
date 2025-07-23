
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import StatusIndicator from "@/components/shared/StatusIndicator";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { WithdrawalRecord } from "@/types/trading";
import { History, Download, ExternalLink, RefreshCw, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";

const WithdrawalLog = () => {
  const [withdrawals, setWithdrawals] = useLocalStorage<WithdrawalRecord[]>('withdrawal_history', []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in real app, this would come from API
      const mockWithdrawals: WithdrawalRecord[] = [
        {
          id: "wd_001",
          amount: 245.00,
          status: "completed",
          timestamp: "2025-07-23T22:00:00Z",
          method: "bank_transfer",
          fee: 2.45,
          reference: "REF789ABC"
        },
        {
          id: "wd_002", 
          amount: 310.00,
          status: "pending",
          timestamp: "2025-07-23T20:30:00Z",
          method: "bank_transfer",
          fee: 3.10,
          reference: "REF456DEF"
        },
        {
          id: "wd_003",
          amount: 185.50,
          status: "failed",
          timestamp: "2025-07-22T18:15:00Z", 
          method: "bank_transfer",
          fee: 1.86,
          reference: "REF123GHI"
        }
      ];
      
      setWithdrawals(mockWithdrawals);
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: WithdrawalRecord['status']) => {
    const variants = {
      success: 'bg-green-500/20 text-green-500 border-green-500/30',
      completed: 'bg-green-500/20 text-green-500 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-500 border-red-500/30'
    };

    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#00FFC2]" />
            Withdrawal History
          </div>
          <Button 
            onClick={fetchWithdrawals}
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="border-[#00FFC2]/20 hover:border-[#00FFC2]/40"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                <div className="h-4 bg-muted rounded w-48"></div>
              </div>
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No withdrawal history found
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-[#00FFC2]/20 rounded-full">
                  <DollarSign className="h-5 w-5 text-[#00FFC2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${withdrawal.amount.toLocaleString()}</span>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(withdrawal.timestamp)} • {withdrawal.reference}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{withdrawal.method}</div>
                <StatusIndicator status={withdrawal.status} />
              </div>
            </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WithdrawalLog;
