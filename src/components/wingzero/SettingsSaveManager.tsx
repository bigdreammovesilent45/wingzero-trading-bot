import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Save, Check, AlertTriangle, RefreshCw } from 'lucide-react';

interface SettingsSaveManagerProps {
  panelName: string;
  settings: any;
  onSave?: () => Promise<void>;
  autoSave?: boolean;
  className?: string;
}

export const SettingsSaveManager: React.FC<SettingsSaveManagerProps> = ({
  panelName,
  settings,
  onSave,
  autoSave = true,
  className = ""
}) => {
  const { toast } = useToast();
  const [lastSaved, setLastSaved] = useLocalStorage<string>(`${panelName}-last-saved`, '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSettingsHash, setLastSettingsHash] = useState('');

  // Create a hash of the settings to detect changes
  const createSettingsHash = (obj: any): string => {
    return JSON.stringify(obj);
  };

  // Check for unsaved changes
  useEffect(() => {
    const currentHash = createSettingsHash(settings);
    if (lastSettingsHash && lastSettingsHash !== currentHash) {
      setHasUnsavedChanges(true);
    }
    setLastSettingsHash(currentHash);
  }, [settings, lastSettingsHash]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        handleSave(true);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [hasUnsavedChanges, autoSave]);

  const handleSave = async (isAutoSave = false) => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      }
      
      const now = new Date().toISOString();
      setLastSaved(now);
      setHasUnsavedChanges(false);
      
      if (!isAutoSave) {
        toast({
          title: "Settings Saved",
          description: `${panelName} settings have been saved successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: `Failed to save ${panelName} settings. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatLastSaved = (isoString: string) => {
    if (!isoString) return 'Never saved';
    const date = new Date(isoString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just saved';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-muted/30 rounded-lg border ${className}`}>
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Settings Status</span>
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved
              </Badge>
            )}
            {!hasUnsavedChanges && lastSaved && (
              <Badge variant="default" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatLastSaved(lastSaved)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {autoSave && (
          <Badge variant="outline" className="text-xs">
            Auto-save {hasUnsavedChanges ? 'pending' : 'on'}
          </Badge>
        )}
        <Button 
          onClick={() => handleSave(false)}
          disabled={isSaving || (!hasUnsavedChanges && !autoSave)}
          size="sm"
          variant={hasUnsavedChanges ? "default" : "outline"}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-3 w-3 animate-spin" />
              Saving...
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Save className="h-3 w-3" />
              Save Now
            </>
          ) : (
            <>
              <Check className="h-3 w-3" />
              Saved
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsSaveManager;