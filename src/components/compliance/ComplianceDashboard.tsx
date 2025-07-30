import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ComplianceService, ComplianceReport, DataRetentionPolicy } from '@/services/ComplianceService';
import { FileText, Download, Shield, Calendar, Database, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const ComplianceDashboard = () => {
  const [complianceService] = useState(() => ComplianceService.getInstance());
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DataRetentionPolicy[]>([]);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    // Mock data for demonstration
    setReports([
      {
        id: 'mifid_2024_q1',
        reportType: 'mifid_ii',
        generatedAt: new Date().toISOString(),
        periodStart: '2024-01-01',
        periodEnd: '2024-03-31',
        status: 'completed',
        data: {
          totalTrades: 1245,
          executionVenues: { internal: 856, external: 389 },
          avgExecutionTime: 2.3,
          complianceScore: 98.5
        }
      },
      {
        id: 'trade_report_2024_q1',
        reportType: 'trade_reporting',
        generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        periodStart: '2024-01-01',
        periodEnd: '2024-03-31',
        status: 'completed',
        data: {
          reportedTrades: 1245,
          pendingReports: 0,
          complianceRate: 100
        }
      }
    ]);

    setRetentionPolicies([
      {
        id: 'eu_trades',
        name: 'EU Trade Data Retention',
        dataType: 'trades',
        retentionPeriod: 2555, // 7 years
        archiveAfter: 1095, // 3 years
        deleteAfter: 2555,
        jurisdiction: 'EU',
        isActive: true,
        lastReviewed: new Date().toISOString()
      },
      {
        id: 'client_comms',
        name: 'Client Communications',
        dataType: 'communications',
        retentionPeriod: 1825, // 5 years
        archiveAfter: 365, // 1 year
        deleteAfter: 1825,
        jurisdiction: 'US',
        isActive: true,
        lastReviewed: new Date().toISOString()
      }
    ]);
  };

  const handleGenerateReport = async (reportType: ComplianceReport['reportType']) => {
    setGenerateLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      let report: ComplianceReport;
      
      if (reportType === 'mifid_ii') {
        report = await complianceService.generateMiFIDIIReport(startDate, endDate);
      } else {
        // Mock other report types
        report = {
          id: `${reportType}_${Date.now()}`,
          reportType,
          generatedAt: new Date().toISOString(),
          periodStart: startDate,
          periodEnd: endDate,
          status: 'completed',
          data: { summary: 'Report generated successfully' }
        };
      }

      setReports(prev => [report, ...prev]);
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setGenerateLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'generating': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getComplianceScore = (data: any): number => {
    if (data?.complianceScore) return data.complianceScore;
    if (data?.complianceRate) return data.complianceRate;
    return Math.floor(Math.random() * 10) + 90; // Mock score
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Compliance & Regulatory Dashboard
          </CardTitle>
          <CardDescription>
            MiFID II, Trade Reporting, Data Retention, and Audit Trail Management
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          <TabsTrigger value="retention">Data Retention</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Report Generation */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Compliance Reports</CardTitle>
              <CardDescription>Create regulatory reports for various jurisdictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => handleGenerateReport('mifid_ii')}
                  disabled={generateLoading}
                  className="h-20 flex flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  <span>MiFID II Report</span>
                </Button>
                <Button
                  onClick={() => handleGenerateReport('trade_reporting')}
                  disabled={generateLoading}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <Database className="h-6 w-6" />
                  <span>Trade Reporting</span>
                </Button>
                <Button
                  onClick={() => handleGenerateReport('best_execution')}
                  disabled={generateLoading}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <Shield className="h-6 w-6" />
                  <span>Best Execution</span>
                </Button>
                <Button
                  onClick={() => handleGenerateReport('transaction_reporting')}
                  disabled={generateLoading}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                >
                  <Calendar className="h-6 w-6" />
                  <span>Transaction Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>View and download compliance reports</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <h4 className="font-medium">
                            {report.reportType.replace('_', ' ').toUpperCase()} Report
                          </h4>
                          <Badge variant={getStatusColor(report.status) as any}>
                            {report.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Period: {format(new Date(report.periodStart), 'PPP')} - {format(new Date(report.periodEnd), 'PPP')}</p>
                          <p>Generated: {format(new Date(report.generatedAt), 'PPp')}</p>
                          {report.data && (
                            <div className="flex items-center gap-4 mt-2">
                              <span>Compliance Score: </span>
                              <div className="flex items-center gap-2">
                                <Progress value={getComplianceScore(report.data)} className="w-20 h-2" />
                                <span className="text-xs font-medium">{getComplianceScore(report.data)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedReport(report)}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Report Details Modal */}
          {selectedReport && (
            <Card>
              <CardHeader>
                <CardTitle>Report Details: {selectedReport.reportType.toUpperCase()}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                  Close
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium">Report Period</h5>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedReport.periodStart), 'PPP')} - {format(new Date(selectedReport.periodEnd), 'PPP')}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-medium">Status</h5>
                      <Badge variant={getStatusColor(selectedReport.status) as any}>
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedReport.data && (
                    <div>
                      <h5 className="font-medium mb-2">Report Summary</h5>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm">{JSON.stringify(selectedReport.data, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policies</CardTitle>
              <CardDescription>Manage data lifecycle and regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionPolicies.map((policy) => (
                  <div key={policy.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{policy.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{policy.jurisdiction}</Badge>
                        <Badge variant={policy.isActive ? "default" : "secondary"}>
                          {policy.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Data Type:</span>
                        <p className="text-muted-foreground capitalize">{policy.dataType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Retention Period:</span>
                        <p className="text-muted-foreground">{Math.floor(policy.retentionPeriod / 365)} years</p>
                      </div>
                      <div>
                        <span className="font-medium">Archive After:</span>
                        <p className="text-muted-foreground">{Math.floor(policy.archiveAfter / 365)} years</p>
                      </div>
                      <div>
                        <span className="font-medium">Last Reviewed:</span>
                        <p className="text-muted-foreground">{format(new Date(policy.lastReviewed), 'PP')}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm">Edit Policy</Button>
                      <Button variant="outline" size="sm">Run Cleanup</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Complete activity log for regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Audit trail functionality integrated with SecurityAudit component</p>
                <p className="text-sm">All user actions and system events are automatically logged</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Monitoring</CardTitle>
              <CardDescription>Real-time compliance status and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                  <p className="text-sm text-green-800 dark:text-green-200">Overall Compliance</p>
                </div>
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">1,245</p>
                  <p className="text-sm text-blue-800 dark:text-blue-200">Trades Reported</p>
                </div>
                <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold text-yellow-600">0</p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">Compliance Issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};