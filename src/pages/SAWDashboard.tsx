
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SAWDashboard from "@/components/saw/Dashboard";
import WithdrawalLog from "@/components/saw/WithdrawalLog";
import ThresholdControls from "@/components/saw/ThresholdControls";
import { ArrowLeft, Vault } from "lucide-react";

const SAWDashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-[#00FFC2]/20 rounded-lg">
                <Vault className="h-5 w-5 text-[#00FFC2]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#00FFC2]">S.A.W.</h1>
                <p className="text-sm text-muted-foreground">Stor-A-Way</p>
              </div>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="history">Withdrawal Log</TabsTrigger>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <SAWDashboard />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <WithdrawalLog />
          </TabsContent>
          
          <TabsContent value="thresholds" className="space-y-6">
            <ThresholdControls />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SAWDashboardPage;
