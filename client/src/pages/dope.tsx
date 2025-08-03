import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Target, Edit2, Trash2, Settings, LogOut, ArrowLeft, Download } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  const [cardToDelete, setCardToDelete] = useState<DopeCard | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  const { data: dopeCards, isLoading } = useQuery<DopeCard[]>({
    queryKey: ["/api/dope-cards"],
    enabled: true,
  });

  const queryClient = useQueryClient();
  
  const deleteCardMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/dope-cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dope-cards"] });
      toast({
        title: "Success",
        description: "DOPE card deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Delete error:", error);
      const errorMessage = error?.message || "Failed to delete DOPE card";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDeleteCard = (card: DopeCard) => {
    setCardToDelete(card);
  };

  const confirmDelete = async () => {
    if (cardToDelete && !deleteCardMutation.isPending) {
      try {
        await deleteCardMutation.mutateAsync(cardToDelete.id);
        setCardToDelete(null);
      } catch (error) {
        // Error is already handled in the mutation's onError
        console.error("Failed to delete DOPE card:", error);
      }
    }
  };

  const downloadDopeCard = async (card: DopeCard) => {
    try {
      // Fetch the range data for this card
      const ranges: DopeRange[] = await apiRequest("GET", `/api/dope-cards/${card.id}/ranges`);
      
      console.log("Fetched ranges:", ranges);
      
      // Generate ASCII table content - even if ranges is empty
      const generateAsciiTable = (card: DopeCard, ranges: DopeRange[]) => {
        const title = `DOPE CARD: ${card.rifle} - ${card.calibre}`;
        const subtitle = `Card Name: ${card.name}`;
        const divider = "=".repeat(60);
        const minorDivider = "-".repeat(60);
        
        let content = `${divider}\n`;
        content += `${title.padStart((60 + title.length) / 2)}\n`;
        content += `${subtitle.padStart((60 + subtitle.length) / 2)}\n`;
        content += `${divider}\n\n`;
        content += `${minorDivider}\n`;
        content += `| Distance | Windage | Elevation |\n`;
        content += `|   (yds)  |  (MOA)  |   (MOA)   |\n`;
        content += `${minorDivider}\n`;
        
        if (ranges && ranges.length > 0) {
          // Sort ranges by distance
          const sortedRanges = [...ranges].sort((a, b) => a.range - b.range);
          
          for (const range of sortedRanges) {
            const distance = range.range.toString().padStart(6);
            // Handle null/undefined values by showing blank spaces
            const windage = range.windage !== null && range.windage !== undefined 
              ? range.windage.toFixed(1).padStart(6)
              : "".padStart(6);
            const elevation = range.elevation !== null && range.elevation !== undefined 
              ? range.elevation.toFixed(1).padStart(7)
              : "".padStart(7);
            content += `|${distance}  |${windage}  |${elevation}  |\n`;
          }
        } else {
          // Empty table message
          content += `|          |         |           |\n`;
          content += `|    (No range data available)    |\n`;
          content += `|          |         |           |\n`;
        }
        
        content += `${minorDivider}\n\n`;
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `ShotTracker Pro - Precision Shooting Logger\n`;
        
        return content;
      };
      
      const content = generateAsciiTable(card, ranges);
      const filename = `DOPE_${card.rifle.replace(/\s+/g, '_')}_${card.calibre.replace(/\s+/g, '_')}.txt`;
      
      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: `DOPE card exported as ${filename}`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: `Failed to export DOPE card: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity min-w-0 flex-shrink">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="text-white" size={18} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">DOPE Cards</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Data on Previous Engagements</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-1 sm:space-x-4">
              <Button 
                asChild 
                variant="outline" 
                size="sm"
                className="px-2 sm:px-4"
              >
                <Link href="/" className="flex items-center">
                  <ArrowLeft className="mr-1 sm:mr-2" size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
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
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()} className="text-red-600">
                    <LogOut className="mr-2" size={14} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-4 sm:space-y-6">
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
                            downloadDopeCard(card);
                          }}
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                          title="Download as .txt file"
                        >
                          <Download size={14} />
                        </Button>
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
                            handleDeleteCard(card);
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DOPE Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{cardToDelete?.name}"? This action cannot be undone and will permanently remove all range data associated with this DOPE card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCardMutation.isPending}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 disabled:opacity-50"
            >
              {deleteCardMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}