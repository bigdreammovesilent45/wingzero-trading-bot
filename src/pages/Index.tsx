
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vault, Zap, User, LogOut } from "lucide-react";
import { useAutoStartTrading } from "@/hooks/useAutoStartTrading";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  // Auto-start trading system when app loads
  const { hasAutoStarted } = useAutoStartTrading();
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="mb-8">
          {user && (
            <div className="flex justify-center mb-6">
              <Card className="w-full max-w-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Welcome back
                    </div>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </CardContent>
              </Card>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Trading Command Center
            </h1>
            {hasAutoStarted && (
              <Badge variant="default" className="bg-green-500 animate-pulse">
                🚀 Live Trading
              </Badge>
            )}
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional trading automation suite with S.A.W. middleware and Wing Zero bot control
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* S.A.W. Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00FFC2]/10 to-[#2C2F33]/20 p-8 border border-[#00FFC2]/20 hover:border-[#00FFC2]/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFC2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center justify-center w-16 h-16 bg-[#00FFC2]/20 rounded-2xl mb-6 mx-auto">
                <Vault className="w-8 h-8 text-[#00FFC2]" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-[#00FFC2]">S.A.W.</h3>
              <p className="text-sm text-muted-foreground mb-4">Stor-A-Way</p>
              <p className="text-muted-foreground mb-6">
                Automated fund withdrawal management with secure broker API integration and real-time monitoring.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-[#00FFC2]/20 text-[#00FFC2] rounded-full text-sm">Secure</span>
                <span className="px-3 py-1 bg-[#00FFC2]/20 text-[#00FFC2] rounded-full text-sm">Automated</span>
                <span className="px-3 py-1 bg-[#00FFC2]/20 text-[#00FFC2] rounded-full text-sm">Reliable</span>
              </div>
              
              <Link to="/saw">
                <Button className="w-full bg-[#00FFC2] hover:bg-[#00FFC2]/80 text-black font-medium">
                  Launch S.A.W.
                </Button>
              </Link>
              
              <p className="text-xs text-[#00FFC2] mt-4 font-medium">
                "Your funds. Your flow. Automated."
              </p>
            </div>
          </div>
          
          {/* Wing Zero Card */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#00AEEF]/10 to-[#000000]/20 p-8 border border-[#00AEEF]/20 hover:border-[#00AEEF]/40 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00AEEF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center justify-center w-16 h-16 bg-[#00AEEF]/20 rounded-2xl mb-6 mx-auto">
                <Zap className="w-8 h-8 text-[#00AEEF]" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-[#00AEEF]">Wing Zero</h3>
              <p className="text-sm text-muted-foreground mb-4">Trading Bot Control</p>
              <p className="text-muted-foreground mb-6">
                Advanced trading bot interface with performance metrics, strategy monitoring, and execution control.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 bg-[#00AEEF]/20 text-[#00AEEF] rounded-full text-sm">Tactical</span>
                <span className="px-3 py-1 bg-[#00AEEF]/20 text-[#00AEEF] rounded-full text-sm">Precise</span>
                <span className="px-3 py-1 bg-[#00AEEF]/20 text-[#00AEEF] rounded-full text-sm">Intelligent</span>
              </div>
              
              <Link to="/wingzero">
                <Button className="w-full bg-[#00AEEF] hover:bg-[#00AEEF]/80 text-black font-medium">
                  Launch Wing Zero
                </Button>
              </Link>
              
              <p className="text-xs text-[#00AEEF] mt-4 font-medium">
                "Built to win. Wired to act."
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <Link to="/settings">
            <Button variant="outline" className="px-8">
              Settings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
