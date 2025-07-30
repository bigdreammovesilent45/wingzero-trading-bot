import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Report = Database['public']['Tables']['reports']['Row'];
type ReportInsert = Database['public']['Tables']['reports']['Insert'];
type ScheduledReport = Database['public']['Tables']['scheduled_reports']['Row'];
type ScheduledReportInsert = Database['public']['Tables']['scheduled_reports']['Insert'];

export class ReportingService {
  private static instance: ReportingService;

  static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  async generateReport(userId: string, reportData: ReportInsert): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        ...reportData,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getReports(userId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getReportById(reportId: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error) return null;
    return data;
  }

  async deleteReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
  }

  async createScheduledReport(userId: string, scheduleData: ScheduledReportInsert): Promise<ScheduledReport> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .insert([{
        ...scheduleData,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getScheduledReports(userId: string): Promise<ScheduledReport[]> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateScheduledReport(reportId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport> {
    const { data, error } = await supabase
      .from('scheduled_reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async generateDailyReport(userId: string): Promise<Report> {
    // Get trading data for the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', yesterday.toISOString());

    const totalTrades = trades?.length || 0;
    const profitableTrades = trades?.filter(t => (t.profit || 0) > 0).length || 0;
    const totalProfit = trades?.reduce((sum, t) => sum + (t.profit || 0), 0) || 0;
    
    const reportData: ReportInsert = {
      type: 'daily',
      title: `Daily Report - ${new Date().toLocaleDateString()}`,
      format: 'json',
      data: {
        period: {
          start: yesterday.toISOString(),
          end: new Date().toISOString()
        },
        summary: {
          total_trades: totalTrades,
          profit_loss: totalProfit,
          win_rate: totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0,
          roi: 0 // Calculate based on account balance
        },
        trades: trades || []
      },
      user_id: userId
    };

    return await this.generateReport(userId, reportData);
  }

  async generateWeeklyReport(userId: string): Promise<Report> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString());

    const totalTrades = trades?.length || 0;
    const totalProfit = trades?.reduce((sum, t) => sum + (t.profit || 0), 0) || 0;
    
    const reportData: ReportInsert = {
      type: 'weekly',
      title: `Weekly Report - ${new Date().toLocaleDateString()}`,
      format: 'json',
      data: {
        period: {
          start: weekAgo.toISOString(),
          end: new Date().toISOString()
        },
        summary: {
          total_trades: totalTrades,
          profit_loss: totalProfit,
          win_rate: 0,
          roi: 0
        },
        trades: trades || []
      },
      user_id: userId
    };

    return await this.generateReport(userId, reportData);
  }
}