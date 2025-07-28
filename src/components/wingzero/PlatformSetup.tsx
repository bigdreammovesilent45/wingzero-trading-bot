import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ExternalLink } from "lucide-react";

interface PlatformSetupProps {
  platform: string;
  onConfigUpdate: (config: any) => void;
}

const platformInfo = {
  ninjatrader: {
    name: "NinjaTrader",
    description: "Advanced futures and forex trading platform",
    setupUrl: "https://ninjatrader.com/support/helpGuides/nt8/?automated_trading_interface.htm",
    requirements: [
      "NinjaTrader 8 installation",
      "NTDirect license (additional cost)",
      "Enable ATI (Automated Trading Interface)",
      "Configure connection settings"
    ]
  },
  tradingview: {
    name: "TradingView",
    description: "Web-based charting and trading platform",
    setupUrl: "https://www.tradingview.com/support/solutions/43000529348-about-tradingview-webhooks/",
    requirements: [
      "TradingView Pro+ subscription",
      "Broker integration setup",
      "Webhook configuration for alerts",
      "API endpoint configuration"
    ]
  },
  interactivebrokers: {
    name: "Interactive Brokers",
    description: "Professional brokerage with TWS API",
    setupUrl: "https://interactivebrokers.github.io/tws-api/",
    requirements: [
      "Interactive Brokers account",
      "TWS (Trader Workstation) installed",
      "Enable API connections in TWS",
      "Configure socket port and client ID"
    ]
  },
  binance: {
    name: "Binance",
    description: "Leading cryptocurrency exchange",
    setupUrl: "https://binance-docs.github.io/apidocs/spot/en/",
    requirements: [
      "Binance account with API access",
      "API Key and Secret Key",
      "IP whitelist configuration",
      "Enable spot/futures trading permissions"
    ]
  }
};

export function PlatformSetup({ platform, onConfigUpdate }: PlatformSetupProps) {
  const info = platformInfo[platform as keyof typeof platformInfo];

  if (!info) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Platform Not Yet Supported</AlertTitle>
            <AlertDescription>
              This platform integration is coming soon. Check back for updates!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{info.name} Setup</CardTitle>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Setup Required</AlertTitle>
          <AlertDescription>
            This platform requires additional setup. Follow the requirements below and visit the documentation for detailed instructions.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h4 className="font-medium">Requirements:</h4>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            {info.requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild>
            <a href={info.setupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View {info.name} Documentation
            </a>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onConfigUpdate({ 
              type: platform, 
              platform: platform,
              status: 'setup_required'
            })}
          >
            Mark as In Progress
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Full integration for {info.name} is under development. This will mark the platform as "in progress" for now.</p>
        </div>
      </CardContent>
    </Card>
  );
}