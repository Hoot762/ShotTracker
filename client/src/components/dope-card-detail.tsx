import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DopeCard, DopeRange, InsertDopeRange } from "@shared/schema";

interface DopeCardDetailProps {
  card: DopeCard;
  onClose: () => void;
}

interface RangeEditState {
  id?: string;
  range: number;
  elevation: number | null;
  windage: number | null;
}

const STANDARD_RANGES = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1200];

export default function DopeCardDetail({ card, onClose }: DopeCardDetailProps) {
  const [editingRange, setEditingRange] = useState<RangeEditState | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ranges, isLoading } = useQuery<DopeRange[]>({
    queryKey: [`/api/dope-cards/${card.id}/ranges`],
    queryFn: async () => {
      const res = await fetch(`/api/dope-cards/${card.id}/ranges`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch ranges');
      return res.json();
    },
    enabled: true,
  });

  const createRangeMutation = useMutation({
    mutationFn: async (data: InsertDopeRange) => {
      return apiRequest('POST', `/api/dope-cards/${card.id}/ranges`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dope-cards/${card.id}/ranges`] });
      setEditingRange(null);
      toast({
        title: "Success",
        description: "Range data added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add range data",
        variant: "destructive",
      });
    },
  });

  const updateRangeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDopeRange> }) => {
      return apiRequest('PUT', `/api/dope-ranges/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dope-cards/${card.id}/ranges`] });
      setEditingRange(null);
      toast({
        title: "Success",
        description: "Range data updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update range data",
        variant: "destructive",
      });
    },
  });

  const deleteRangeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/dope-ranges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/dope-cards/${card.id}/ranges`] });
      toast({
        title: "Success",
        description: "Range data deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete range data",
        variant: "destructive",
      });
    },
  });

  const handleSaveRange = () => {
    if (!editingRange) return;

    const data = {
      range: editingRange.range,
      elevation: editingRange.elevation,
      windage: editingRange.windage,
    };

    if (editingRange.id) {
      updateRangeMutation.mutate({ id: editingRange.id, data });
    } else {
      createRangeMutation.mutate(data);
    }
  };

  const handleEditRange = (range?: DopeRange) => {
    if (range) {
      setEditingRange({
        id: range.id,
        range: range.range,
        elevation: range.elevation,
        windage: range.windage,
      });
    } else {
      setEditingRange({
        range: 100,
        elevation: null,
        windage: null,
      });
    }
  };

  const handleDeleteRange = (id: string) => {
    if (confirm("Are you sure you want to delete this range data?")) {
      deleteRangeMutation.mutate(id);
    }
  };

  // Create a merged list of ranges with data
  const rangeData = STANDARD_RANGES.map(standardRange => {
    const existingRange = ranges?.find(r => r.range === standardRange);
    return {
      range: standardRange,
      data: existingRange || null,
    };
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg sm:text-xl">{card.name}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {card.rifle} • {card.calibre}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Range Data Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
              <h3 className="text-lg font-semibold">Range Data</h3>
              <Button 
                onClick={() => handleEditRange()}
                size="sm"
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                <Plus className="mr-2" size={16} />
                Add Range
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[600px] sm:min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 sm:w-auto">Range (yards)</TableHead>
                      <TableHead className="w-32 sm:w-auto">Elevation (MOA)</TableHead>
                      <TableHead className="w-32 sm:w-auto">Windage (MOA)</TableHead>
                      <TableHead className="w-32 sm:w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                        Loading range data...
                      </TableCell>
                    </TableRow>
                  ) : (
                    rangeData.map(({ range, data }) => (
                      <TableRow key={range} className={`${data ? "bg-white" : "bg-slate-50"} hover:bg-slate-100`}>
                        <TableCell className="font-semibold text-slate-700">{range} yds</TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <Input
                              type="number"
                              step="0.25"
                              placeholder="Enter MOA"
                              value={editingRange.elevation || ""}
                              onChange={(e) => setEditingRange({
                                ...editingRange,
                                elevation: e.target.value ? Number(e.target.value) : null
                              })}
                              className="w-20 sm:w-24 h-8 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className={data ? "font-medium text-slate-900" : "text-slate-400"}>
                              {data?.elevation !== null && data?.elevation !== undefined ? `${data.elevation.toFixed(2)} MOA` : "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <Input
                              type="number"
                              step="0.25"
                              placeholder="Enter MOA"
                              value={editingRange.windage || ""}
                              onChange={(e) => setEditingRange({
                                ...editingRange,
                                windage: e.target.value ? Number(e.target.value) : null
                              })}
                              className="w-20 sm:w-24 h-8 text-sm"
                            />
                          ) : (
                            <span className={data ? "font-medium text-slate-900" : "text-slate-400"}>
                              {data?.windage !== null && data?.windage !== undefined ? `${data.windage.toFixed(2)} MOA` : "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-1 sm:space-x-1">
                              <Button 
                                size="sm" 
                                onClick={handleSaveRange}
                                disabled={createRangeMutation.isPending || updateRangeMutation.isPending}
                                className="h-8 px-2 sm:px-3 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                              >
                                <Save size={12} />
                                <span className="ml-1 hidden sm:inline">Save</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingRange(null)}
                                className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                              >
                                <X size={12} />
                                <span className="ml-1 hidden sm:inline">Cancel</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-1 sm:space-x-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditRange(data || undefined)}
                                className="h-8 px-2 sm:px-3 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm"
                              >
                                <Edit2 size={12} />
                                <span className="ml-1 hidden sm:inline">Edit</span>
                              </Button>
                              {data && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteRange(data.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 h-8 px-2 sm:px-3 text-xs sm:text-sm"
                                >
                                  <Trash2 size={12} />
                                  <span className="ml-1 hidden sm:inline">Delete</span>
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}