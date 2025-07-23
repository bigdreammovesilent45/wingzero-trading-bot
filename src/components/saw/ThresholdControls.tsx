
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Check } from "lucide-react";
import { useState } from "react";

interface ThresholdSettings {
  profitThreshold: number;
  balanceThreshold: number;
  withdrawalPercentage: number;
  enabled: boolean;
}

const ThresholdControls = () => {
  const [settings, setSettings] = useLocalStorage<ThresholdSettings>('threshold_settings', {
    profitThreshold: 100,
    balanceThreshold: 2000,
    withdrawalPercentage: 10,
    enabled: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastSaved(new Date());
      toast({
        title: "Settings Saved",
        description: "Threshold settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save threshold settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof ThresholdSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#00FFC2]" />
          Threshold Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Auto-Withdrawal</Label>
            <p className="text-sm text-muted-foreground">Enable automatic withdrawals</p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(value) => updateSetting('enabled', value)}
            className="data-[state=checked]:bg-[#00FFC2]"
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">
              Profit Threshold: ${settings.profitThreshold}
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Minimum profit required to trigger withdrawal
            </p>
            <Slider
              value={[settings.profitThreshold]}
              onValueChange={(value) => updateSetting('profitThreshold', value[0])}
              max={1000}
              min={50}
              step={25}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              Balance Threshold: ${settings.balanceThreshold}
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Minimum account balance to allow withdrawal
            </p>
            <Slider
              value={[settings.balanceThreshold]}
              onValueChange={(value) => updateSetting('balanceThreshold', value[0])}
              max={10000}
              min={1000}
              step={100}
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium">
              Withdrawal Percentage: {settings.withdrawalPercentage}%
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Percentage of profit to withdraw
            </p>
            <Slider
              value={[settings.withdrawalPercentage]}
              onValueChange={(value) => updateSetting('withdrawalPercentage', value[0])}
              max={50}
              min={5}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#00FFC2] hover:bg-[#00FFC2]/80 text-black font-medium"
          >
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : lastSaved ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          
          {lastSaved && (
            <p className="text-xs text-muted-foreground text-center">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThresholdControls;
