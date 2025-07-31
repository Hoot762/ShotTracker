import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{card.name}</span>
            <div className="text-sm font-normal text-slate-500">
              {card.rifle} • {card.calibre}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Range Data Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Range Data</h3>
              <Button 
                onClick={() => handleEditRange()}
                size="sm"
              >
                <Plus className="mr-2" size={16} />
                Add Range
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Range (yards)</TableHead>
                    <TableHead>Elevation (MOA)</TableHead>
                    <TableHead>Windage (MOA)</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
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
                      <TableRow key={range} className={data ? "" : "text-slate-400"}>
                        <TableCell className="font-medium">{range}</TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <Input
                              type="number"
                              step="0.25"
                              placeholder="0.0"
                              value={editingRange.elevation || ""}
                              onChange={(e) => setEditingRange({
                                ...editingRange,
                                elevation: e.target.value ? Number(e.target.value) : null
                              })}
                              className="w-20"
                            />
                          ) : (
                            data?.elevation?.toFixed(2) || "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <Input
                              type="number"
                              step="0.25"
                              placeholder="0.0"
                              value={editingRange.windage || ""}
                              onChange={(e) => setEditingRange({
                                ...editingRange,
                                windage: e.target.value ? Number(e.target.value) : null
                              })}
                              className="w-20"
                            />
                          ) : (
                            data?.windage?.toFixed(2) || "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {editingRange && editingRange.range === range ? (
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={handleSaveRange}
                                disabled={createRangeMutation.isPending || updateRangeMutation.isPending}
                              >
                                <Save size={14} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setEditingRange(null)}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEditRange(data || undefined)}
                              >
                                <Edit2 size={14} />
                              </Button>
                              {data && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteRange(data.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
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
      </DialogContent>
    </Dialog>
  );
}