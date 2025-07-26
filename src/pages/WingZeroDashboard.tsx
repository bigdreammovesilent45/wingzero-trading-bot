
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotMetrics from "@/components/wingzero/BotMetrics";
import TradeHistory from "@/components/wingzero/TradeHistory";
import ControlPanel from "@/components/wingzero/ControlPanel";
import LivePositions from "@/components/wingzero/LivePositions";
import PassiveIncomeTracker from "@/components/wingzero/PassiveIncomeTracker";
import { ArrowLeft, Zap } from "lucide-react";
import { useAutoStartTrading } from "@/hooks/useAutoStartTrading";

const WingZeroDashboardPage = () => {
  // Auto-start trading when page loads
  useAutoStartTrading();
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
              <div className="flex items-center justify-center w-8 h-8 bg-[#00AEEF]/20 rounded-lg">
                <Zap className="h-5 w-5 text-[#00AEEF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#00AEEF]">Wing Zero</h1>
                <p className="text-sm text-muted-foreground">Passive Income Generator</p>
              </div>
            </div>
          </div>
          <Link to="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="income">Passive Income</TabsTrigger>
            <TabsTrigger value="control">Control Panel</TabsTrigger>
            <TabsTrigger value="positions">Live Positions</TabsTrigger>
            <TabsTrigger value="metrics">Performance</TabsTrigger>
            <TabsTrigger value="trades">Trade History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="space-y-6">
            <PassiveIncomeTracker />
          </TabsContent>
          
          <TabsContent value="control" className="space-y-6">
            <ControlPanel />
          </TabsContent>
          
          <TabsContent value="positions" className="space-y-6">
            <LivePositions />
          </TabsContent>
          
          <TabsContent value="metrics" className="space-y-6">
            <BotMetrics />
          </TabsContent>
          
          <TabsContent value="trades" className="space-y-6">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WingZeroDashboardPage;
