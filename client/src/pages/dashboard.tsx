import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/queryClient";
import { Target, TrendingUp, Trophy, LogOut, Settings, Plus, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import SessionForm from "@/components/session-form";
import SessionList from "@/components/session-list";
import SessionFilters from "@/components/session-filters";
import SessionDetailModal from "@/components/session-detail-modal";
import DeleteSessionDialog from "@/components/delete-session-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { exportFilteredSessions } from "@/lib/exportUtils";
import type { Database } from "@/lib/supabase";

type Session = Database['public']['Tables']['sessions']['Row'];

interface FilterState {
  name?: string;
  dateFrom?: string;
  dateTo?: string;
  rifle?: string;
  distance?: number;
}

export default function Dashboard() {
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [deleteSession, setDeleteSession] = useState<Session | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions', filters],
    queryFn: async () => {
      const userId = await getCurrentUserId();
      
      let query = supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      if (filters.rifle) {
        query = query.ilike('rifle', `%${filters.rifle}%`);
      }
      if (filters.distance) {
        query = query.eq('distance', filters.distance);
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
      },
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!sessions || sessions.length === 0) {
      toast({
        title: "No data to export",
        description: "Please add some shooting sessions first",
        variant: "destructive",
      });
      return;
    }

    try {
      const exportedCount = exportFilteredSessions(sessions, filters, format);
      toast({
        title: "Export successful",
        description: `${exportedCount} sessions exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    }
  };

  const stats = sessions ? {
    total: sessions.length,
    average: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.total_score, 0) / sessions.length : 0,
    best: sessions.length > 0 ? (() => {
      const bestSession = sessions.reduce((best, current) => 
        current.total_score > best.total_score ? current : best
      );
      return `${bestSession.total_score}.${bestSession.v_count}`;
    })() : "0.0",
  } : { total: 0, average: 0, best: "0.0" };



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity min-w-0 flex-shrink">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">ShotTracker Pro</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Precision Shooting Logger</p>
              </div>
            </Link>
            
            <nav className="flex items-center space-x-1 sm:space-x-4">
              {/* Mobile Menu - Hamburger with actions */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-2">
                      <Plus size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditSession(null);
                      setShowNewSession(!showNewSession);
                    }}>
                      <Target className="mr-2" size={14} />
                      New Session
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dope" className="flex items-center">
                        <Target className="mr-2" size={14} />
                        DOPE Cards
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileSpreadsheet className="mr-2" size={14} />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="mr-2" size={14} />
                      Export PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Buttons */}
              <Button 
                onClick={() => {
                  setEditSession(null);
                  setShowNewSession(!showNewSession);
                }}
                className="hidden sm:flex items-center"
              >
                <Target className="mr-2" size={16} />
                New Session
              </Button>
              <Button 
                asChild 
                variant="outline"
                className="hidden sm:flex items-center"
              >
                <Link href="/dope">
                  <Target className="mr-2" size={16} />
                  DOPE Cards
                </Link>
              </Button>
              
              {/* Export Dropdown for Desktop */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden sm:flex items-center">
                    <Download className="mr-2" size={16} />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <FileSpreadsheet className="mr-2" size={16} />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileText className="mr-2" size={16} />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Settings size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.email}
                    {user?.is_admin && <span className="text-xs text-blue-600 block">Admin</span>}
                  </div>

                  {user?.is_admin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Settings className="mr-2" size={14} />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2" size={14} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Target className="text-primary" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Average Score</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.average.toFixed(1)}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-emerald-600" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Best Score</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.best}</p>
                  </div>
                  <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center">
                    <Trophy className="text-violet-600" size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4 lg:space-y-6">
              {/* New Session Form */}
              <SessionForm 
                isOpen={showNewSession || !!editSession} 
                onToggle={() => {
                  if (showNewSession || editSession) {
                    // Close the form
                    setShowNewSession(false);
                    setEditSession(null);
                  } else {
                    // Open the form for new session
                    setShowNewSession(true);
                    setEditSession(null);
                  }
                }} 
                editSession={editSession}
              />

              {/* Sessions List */}
              <SessionList 
                sessions={sessions || []}
                isLoading={isLoading}
                onSessionSelect={setSelectedSession}
                onSessionEdit={(session) => {
                  setEditSession(session);
                  setShowNewSession(false);
                }}
                onSessionDelete={(session) => {
                  setDeleteSession(session);
                }}
              />
            </div>

            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <SessionFilters onFiltersChange={setFilters} />
            </div>
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}

      {/* Delete Session Dialog */}
      <DeleteSessionDialog
        session={deleteSession}
        onClose={() => setDeleteSession(null)}
      />
    </div>
  );
}
