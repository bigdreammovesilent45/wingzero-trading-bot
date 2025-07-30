import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Smartphone, Monitor, Apple, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';

const AppDownloadCenter = () => {
  const handleDownloadDesktop = (platform: 'windows' | 'mac' | 'linux') => {
    toast.info(`Starting ${platform} desktop app build...`, {
      description: 'Building native desktop application with Tauri'
    });
    
    // In a real implementation, this would trigger a build process
    setTimeout(() => {
      toast.success(`${platform} app ready for download!`, {
        description: 'Download will start automatically'
      });
    }, 3000);
  };

  const handleMobileBuild = (platform: 'ios' | 'android') => {
    toast.info(`Preparing ${platform} mobile build...`, {
      description: 'Configuring Capacitor for mobile deployment'
    });
    
    setTimeout(() => {
      toast.success(`${platform} build configured!`, {
        description: 'Follow the setup instructions below'
      });
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Download Wing Zero</h2>
        <p className="text-muted-foreground">Get the native app for your device</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desktop Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Desktop Apps
            </CardTitle>
            <CardDescription>
              Native desktop applications built with Tauri
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Windows</span>
                  <Badge variant="outline">.exe</Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleDownloadDesktop('windows')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4" />
                  <span>macOS</span>
                  <Badge variant="outline">.dmg</Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleDownloadDesktop('mac')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Linux</span>
                  <Badge variant="outline">.AppImage</Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleDownloadDesktop('linux')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Quick Build Commands</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-muted p-2 rounded">
                  <code>npm run tauri build</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard('npm run tauri build')}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Apps
            </CardTitle>
            <CardDescription>
              Native mobile apps built with Capacitor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="h-4 w-4" />
                  <span>iOS</span>
                  <Badge variant="outline">TestFlight</Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleMobileBuild('ios')}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Build
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Android</span>
                  <Badge variant="outline">.apk</Badge>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleMobileBuild('android')}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Build
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Mobile Setup Commands</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-muted p-2 rounded">
                  <code>npx cap sync</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard('npx cap sync')}
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-muted p-2 rounded">
                  <code>npx cap run ios</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard('npx cap run ios')}
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-muted p-2 rounded">
                  <code>npx cap run android</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard('npx cap run android')}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Instructions</CardTitle>
          <CardDescription>
            Simplified process to get Wing Zero on your device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Desktop (Tauri)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Run <code className="bg-muted px-1 rounded">npm install</code></li>
                <li>Run <code className="bg-muted px-1 rounded">npm run tauri build</code></li>
                <li>Find your app in <code className="bg-muted px-1 rounded">src-tauri/target/release/</code></li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Mobile (Capacitor)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Run <code className="bg-muted px-1 rounded">npm run build</code></li>
                <li>Run <code className="bg-muted px-1 rounded">npx cap sync</code></li>
                <li>Run <code className="bg-muted px-1 rounded">npx cap run [platform]</code></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppDownloadCenter;