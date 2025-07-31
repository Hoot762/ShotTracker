import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target, TrendingUp, Trophy, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";
import { useAuth, useLogout } from "@/hooks/useAuth";
import SessionForm from "@/components/session-form";
import SessionList from "@/components/session-list";
import SessionFilters from "@/components/session-filters";
import SessionDetailModal from "@/components/session-detail-modal";
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
import type { Session } from "@shared/schema";

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
  const [filters, setFilters] = useState<FilterState>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
      const url = `/api/sessions${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`${res.status}: ${await res.text()}`);
      }
      return res.json();
    },
    enabled: true,
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

  const stats = sessions ? {
    total: sessions.length,
    average: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.totalScore, 0) / sessions.length : 0,
    best: sessions.length > 0 ? Math.max(...sessions.map(s => s.totalScore)) : 0,
  } : { total: 0, average: 0, best: 0 };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Target className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ShotTracker Pro</h1>
                <p className="text-xs text-slate-500">Precision Shooting Logger</p>
              </div>
            </Link>
            <nav className="flex items-center space-x-4">
              <Button onClick={() => setShowNewSession(!showNewSession)}>
                <Target className="mr-2" size={16} />
                New Session
              </Button>
              <Button asChild variant="outline">
                <Link href="/dope">
                  <Target className="mr-2" size={16} />
                  DOPE Cards
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.email}
                    {user?.isAdmin && <span className="text-xs text-blue-600 block">Admin</span>}
                  </div>

                  {user?.isAdmin && (
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SessionFilters onFiltersChange={setFilters} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
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
                      <p className="text-2xl font-bold text-violet-600">{stats.best.toFixed(1)}</p>
                    </div>
                    <div className="w-12 h-12 bg-violet-500/10 rounded-lg flex items-center justify-center">
                      <Trophy className="text-violet-600" size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* New Session Form */}
            <SessionForm 
              isOpen={showNewSession} 
              onToggle={() => setShowNewSession(!showNewSession)} 
            />

            {/* Sessions List */}
            <SessionList 
              sessions={sessions || []}
              isLoading={isLoading}
              onSessionSelect={setSelectedSession}
            />
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
    </div>
  );
}
