import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Edit2, Trash2, Settings } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { DopeCard, DopeRange } from "@shared/schema";
import DopeCardForm from "@/components/dope-card-form";
import DopeCardDetail from "@/components/dope-card-detail";

const useLogout = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });
};

export default function DopePage() {
  const [showNewCard, setShowNewCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DopeCard | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  const { data: dopeCards, isLoading } = useQuery<DopeCard[]>({
    queryKey: ["/api/dope-cards"],
    enabled: true,
  });

  const deleteCardMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dope-cards/${id}`),
    onSuccess: () => {
      useQueryClient().invalidateQueries({ queryKey: ["/api/dope-cards"] });
      toast({
        title: "Success",
        description: "DOPE card deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete DOPE card",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCard = (id: string) => {
    if (confirm("Are you sure you want to delete this DOPE card?")) {
      deleteCardMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Target className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">DOPE Cards</h1>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <Settings size={16} />
                </Button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4">
                    <div className="text-sm text-slate-600 mb-1">Logged in as:</div>
                    <div className="font-medium text-slate-900">{user?.email}</div>
                    {user?.isAdmin && (
                      <div className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-2">
                        Admin
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => logoutMutation.mutate()}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* New DOPE Card Form */}
          <DopeCardForm
            isOpen={showNewCard}
            onToggle={() => setShowNewCard(!showNewCard)}
          />

          {/* DOPE Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="text-slate-500">Loading DOPE cards...</div>
              </div>
            ) : dopeCards && dopeCards.length > 0 ? (
              dopeCards.map((card) => (
                <Card key={card.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-base font-semibold truncate">{card.name}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCard(card);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(card.id);
                          }}
                          className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent 
                    className="space-y-2 pt-0"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rifle:</span>
                        <span className="font-medium truncate ml-2">{card.rifle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Calibre:</span>
                        <span className="font-medium truncate ml-2">{card.calibre}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 pt-1">
                      Click to view ranges
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Target className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No DOPE Cards</h3>
                <p className="text-slate-500 mb-4">
                  Create your first DOPE card to start tracking your scope settings.
                </p>
                <Button onClick={() => setShowNewCard(true)}>
                  <Plus className="mr-2" size={16} />
                  Create DOPE Card
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOPE Card Detail Modal */}
      {selectedCard && (
        <DopeCardDetail
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}