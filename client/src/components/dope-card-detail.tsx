import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/supabase";

type DopeCard = Database['public']['Tables']['dope_cards']['Row'];
type DopeRange = Database['public']['Tables']['dope_ranges']['Row'];
type InsertDopeRange = Database['public']['Tables']['dope_ranges']['Insert'];

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
    queryKey: ['dope-ranges', card.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dope_ranges')
        .select('*')
        .eq('dope_card_id', card.id)
        .order('range', { ascending: true });
        
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  const createRangeMutation = useMutation({
    mutationFn: async (data: Omit<InsertDopeRange, 'dope_card_id'>) => {
      const { data: result, error } = await supabase
        .from('dope_ranges')
        .insert({
          ...data,
          dope_card_id: card.id,
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dope-ranges', card.id] });
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
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<InsertDopeRange, 'dope_card_id'>> }) => {
      const { data: result, error } = await supabase
        .from('dope_ranges')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dope-ranges', card.id] });
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
      const { error } = await supabase
        .from('dope_ranges')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dope-ranges', card.id] });
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

  const handleEditRange = (data?: DopeRange, rangeValue?: number) => {
    if (data) {
      // Editing existing range data
      setEditingRange({
        id: data.id,
        range: data.range,
        elevation: data.elevation,
        windage: data.windage,
      });
    } else if (rangeValue) {
      // Creating new range data for specific range
      setEditingRange({
        range: rangeValue,
        elevation: null,
        windage: null,
      });
    } else {
      // Default fallback
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-3 sm:p-6">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg font-bold text-slate-800">{card.name} - DOPE Card</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            {card.rifle} • {card.calibre}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Range Data Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800">Range Data</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Click Edit to modify elevation and windage settings</p>
              </div>
              <Button 
                onClick={onClose}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                <Save className="mr-2" size={16} />
                Save & Close
              </Button>
            </div>
            
            {/* Desktop Table Layout */}
            <div className="hidden sm:block border rounded-lg overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-24 sm:w-32 font-semibold text-slate-700">Range</TableHead>
                      <TableHead className="w-32 sm:w-40 font-semibold text-slate-700">Elevation (MOA)</TableHead>
                      <TableHead className="w-32 sm:w-40 font-semibold text-slate-700">Windage (MOA)</TableHead>
                      <TableHead className="w-32 sm:w-28 font-semibold text-slate-700">Actions</TableHead>
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
                      <TableRow key={range} className={`${data ? "bg-white" : "bg-slate-50/50"} hover:bg-slate-100 transition-colors`}>
                        <TableCell className="font-semibold text-slate-700 py-3">{range} yds</TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <Input
                              type="number"
                              step="0.25"
                              inputMode="decimal"
                              placeholder="Enter MOA"
                              value={editingRange.elevation !== null ? editingRange.elevation : ""}
                              onChange={(e) => setEditingRange({
                                ...editingRange,
                                elevation: e.target.value !== "" ? Number(e.target.value) : null
                              })}
                              className="w-20 sm:w-28 h-8 text-sm"
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
                              inputMode="decimal"
                              placeholder="Enter MOA"
                              value={editingRange.windage !== null ? editingRange.windage : ""}
                              onChange={(e) => setEditingRange({
                                ...editingRange,
                                windage: e.target.value !== "" ? Number(e.target.value) : null
                              })}
                              className="w-20 sm:w-28 h-8 text-sm"
                            />
                          ) : (
                            <span className={data ? "font-medium text-slate-900" : "text-slate-400"}>
                              {data?.windage !== null && data?.windage !== undefined ? `${data.windage.toFixed(2)} MOA` : "—"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {editingRange && editingRange.range === range ? (
                            <div className="flex flex-row gap-2">
                              <Button 
                                size="sm" 
                                onClick={handleSaveRange}
                                disabled={createRangeMutation.isPending || updateRangeMutation.isPending}
                                className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                <Save size={12} className="mr-1" />
                                Save
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingRange(null)}
                                className="h-8 px-3 text-xs"
                              >
                                <X size={12} className="mr-1" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-row gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditRange(data || undefined, range)}
                                className="h-8 px-3 hover:bg-blue-50 hover:border-blue-300 text-xs"
                              >
                                <Edit2 size={12} className="mr-1" />
                                Edit
                              </Button>
                              {data && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteRange(data.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 h-8 px-3 text-xs"
                                >
                                  <Trash2 size={12} className="mr-1" />
                                  Delete
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

            {/* Mobile Card Layout */}
            <div className="sm:hidden space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-slate-500">
                  Loading range data...
                </div>
              ) : (
                rangeData.map(({ range, data }) => (
                  <div key={range} className={`border rounded-lg p-4 ${data ? "bg-white" : "bg-slate-50/50"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800 text-lg">{range} yards</h4>
                      <div className="flex space-x-2">
                        {editingRange && editingRange.range === range ? (
                          <>
                            <Button
                              onClick={handleSaveRange}
                              size="sm"
                              disabled={createRangeMutation.isPending || updateRangeMutation.isPending}
                              className="px-3 py-1 h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              <Save size={12} className="mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={() => setEditingRange(null)}
                              variant="outline"
                              size="sm"
                              className="px-3 py-1 h-8 text-xs"
                            >
                              <X size={12} className="mr-1" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleEditRange(data || undefined, range)}
                              variant="outline"
                              size="sm"
                              className="px-3 py-1 h-8 hover:bg-blue-50 hover:border-blue-300 text-xs"
                            >
                              <Edit2 size={12} className="mr-1" />
                              Edit
                            </Button>
                            {data && (
                              <Button
                                onClick={() => handleDeleteRange(data.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 px-3 py-1 h-8 text-xs"
                              >
                                <Trash2 size={12} className="mr-1" />
                                Delete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">
                          Elevation (MOA)
                        </label>
                        {editingRange && editingRange.range === range ? (
                          <Input
                            type="number"
                            step="0.25"
                            inputMode="decimal"
                            placeholder="Enter MOA"
                            value={editingRange.elevation !== null ? editingRange.elevation : ""}
                            onChange={(e) => setEditingRange({
                              ...editingRange,
                              elevation: e.target.value !== "" ? Number(e.target.value) : null
                            })}
                            className="w-full h-10"
                            autoFocus
                          />
                        ) : (
                          <div className={`text-lg font-medium ${data ? "text-slate-800" : "text-slate-400"} bg-slate-50 rounded px-3 py-2`}>
                            {data?.elevation !== null && data?.elevation !== undefined ? `${data.elevation.toFixed(2)} MOA` : "—"}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">
                          Windage (MOA)
                        </label>
                        {editingRange && editingRange.range === range ? (
                          <Input
                            type="number"
                            step="0.25"
                            inputMode="decimal"
                            placeholder="Enter MOA"
                            value={editingRange.windage !== null ? editingRange.windage : ""}
                            onChange={(e) => setEditingRange({
                              ...editingRange,
                              windage: e.target.value !== "" ? Number(e.target.value) : null
                            })}
                            className="w-full h-10"
                          />
                        ) : (
                          <div className={`text-lg font-medium ${data ? "text-slate-800" : "text-slate-400"} bg-slate-50 rounded px-3 py-2`}>
                            {data?.windage !== null && data?.windage !== undefined ? `${data.windage.toFixed(2)} MOA` : "—"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}