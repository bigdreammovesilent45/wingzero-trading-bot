
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BotMetrics from "@/components/wingzero/BotMetrics";
import TradeHistory from "@/components/wingzero/TradeHistory";
import ControlPanel from "@/components/wingzero/ControlPanel";
import { PlatformLivePositions } from "@/components/wingzero/PlatformLivePositions";
import PassiveIncomeTracker from "@/components/wingzero/PassiveIncomeTracker";
import { PlatformConnectionStatus } from "@/components/wingzero/PlatformConnectionStatus";
import { PlatformSelector } from "@/components/wingzero/PlatformSelector";
import { AIBrainControls } from "@/components/wingzero/AIBrainControls";
import EnterpriseControls from "@/components/wingzero/EnterpriseControls";
import ProductionValidation from "@/components/wingzero/ProductionValidation";
import FixLivePositions from "@/components/wingzero/FixLivePositions";
import { TradingNotifications } from "@/components/wingzero/TradingNotifications";
import { AutoTradingControls } from "@/components/wingzero/AutoTradingControls";
import { ProductionHealthCheck } from "@/components/wingzero/ProductionHealthCheck";
import { ArrowLeft, Zap, Settings as SettingsIcon } from "lucide-react";
import { useAutoStartTrading } from "@/hooks/useAutoStartTrading";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const WingZeroDashboardPage = () => {
  const [selectedPlatform] = useLocalStorage('wingzero-platform', 'ctrader');
  const [showPlatformSelector, setShowPlatformSelector] = useLocalStorage('wingzero-show-selector', false);
  
  // Auto-start trading when page loads
  useAutoStartTrading();

  if (showPlatformSelector) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
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
                  <p className="text-sm text-muted-foreground">Platform Setup</p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPlatformSelector(false)}>
              Back to Dashboard
            </Button>
          </div>
          <PlatformSelector onConfigUpdate={() => setShowPlatformSelector(false)} />
        </div>
      </div>
    );
  }

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPlatformSelector(true)}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Platform Setup
            </Button>
            <Link to="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="income" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="auto">Auto Trade</TabsTrigger>
            <TabsTrigger value="control">Control</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="validation">Production</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="trades">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income" className="space-y-6">
            <PassiveIncomeTracker />
          </TabsContent>

          <TabsContent value="auto" className="space-y-6">
            <AutoTradingControls />
          </TabsContent>
          
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ControlPanel />
              </div>
              <div>
                <PlatformConnectionStatus />
              </div>
            </div>
            <AIBrainControls isConnected={selectedPlatform !== null} />
            <EnterpriseControls isConnected={selectedPlatform !== null} />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <TradingNotifications />
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <ProductionHealthCheck />
          </TabsContent>
          
          <TabsContent value="validation" className="space-y-6">
            <ProductionValidation isConnected={selectedPlatform !== null} />
          </TabsContent>
          
          <TabsContent value="positions" className="space-y-6">
            <FixLivePositions />
            <PlatformLivePositions />
          </TabsContent>
          
          <TabsContent value="trades" className="space-y-6">
            <TradeHistory />
            <BotMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WingZeroDashboardPage;
