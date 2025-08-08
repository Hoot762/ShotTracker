import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/lib/queryClient";
import { ChevronDown, Plus, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import ScoringSection from "@/components/scoring-section";
import PhotoUpload from "@/components/photo-upload";
import type { Database } from "@/lib/supabase";

type Session = Database['public']['Tables']['sessions']['Row'];

const insertSessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  date: z.string().min(1, "Date is required"),
  rifle: z.string().min(1, "Rifle is required"),
  calibre: z.string().min(1, "Calibre is required"),
  bullet_weight: z.number().min(1, "Bullet weight must be at least 1 grain"),
  distance: z.number().min(1, "Distance must be at least 1 yard"),
  elevation: z.number().nullable().optional(),
  windage: z.number().nullable().optional(),
  shots: z.array(z.union([z.string(), z.number()])).length(12),
  notes: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
});

type InsertSession = z.infer<typeof insertSessionSchema>;

interface SessionFormProps {
  isOpen: boolean;
  onToggle: () => void;
  editSession?: Session | null;
}

// Calculate score from shots array
function calculateScore(shots: (string | number)[]): { totalScore: number; vCount: number } {
  let totalScore = 0;
  let vCount = 0;
  
  for (const shot of shots) {
    if (shot === 'V' || shot === 'v') {
      totalScore += 5;
      vCount += 1;
    } else if (typeof shot === 'number') {
      totalScore += shot;
    } else if (typeof shot === 'string' && !isNaN(Number(shot))) {
      totalScore += Number(shot);
    }
  }
  
  return { totalScore, vCount };
}

export default function SessionForm({ isOpen, onToggle, editSession }: SessionFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deleteExistingPhoto, setDeleteExistingPhoto] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editSession;

  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split('T')[0],
      rifle: "",
      calibre: "",
      bullet_weight: 0,
      distance: 100,
      elevation: null,
      windage: null,
      shots: Array(12).fill(""),
      notes: "",
    },
  });

  // Update form when editSession changes
  useEffect(() => {
    setPhotoFile(null);
    setDeleteExistingPhoto(false);
    
    if (editSession) {
      form.reset({
        name: editSession.name,
        date: editSession.date,
        rifle: editSession.rifle,
        calibre: editSession.calibre,
        bullet_weight: editSession.bullet_weight,
        distance: editSession.distance,
        elevation: editSession.elevation,
        windage: editSession.windage,
        shots: editSession.shots,
        notes: editSession.notes || "",
      });
    } else {
      form.reset({
        name: "",
        date: new Date().toISOString().split('T')[0],
        rifle: "",
        calibre: "",
        bullet_weight: 0,
        distance: 100,
        elevation: null,
        windage: null,
        shots: Array(12).fill(""),
        notes: "",
      });
    }
  }, [editSession, form]);

  const sessionMutation = useMutation({
    mutationFn: async (data: InsertSession) => {
      const userId = await getCurrentUserId();
      const { totalScore, vCount } = calculateScore(data.shots);
      
      let photoUrl = null;
      
      // Handle photo upload
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('session-photos')
          .upload(fileName, photoFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('session-photos')
          .getPublicUrl(fileName);
          
        photoUrl = publicUrl;
      } else if (isEditing && !deleteExistingPhoto) {
        photoUrl = editSession?.photo_url;
      }
      
      const sessionData = {
        user_id: userId,
        name: data.name,
        date: data.date,
        rifle: data.rifle,
        calibre: data.calibre,
        bullet_weight: Number(data.bullet_weight) || 168,
        distance: Number(data.distance) || 100,
        elevation: data.elevation !== null && data.elevation !== undefined ? Number(data.elevation) : null,
        windage: data.windage !== null && data.windage !== undefined ? Number(data.windage) : null,
        shots: data.shots.map(shot => shot.toString()),
        total_score: totalScore,
        v_count: vCount,
        photo_url: photoUrl,
        notes: data.notes || null,
      };
      
      if (isEditing) {
        const { data: result, error } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', editSession.id)
          .select()
          .single();
          
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select()
          .single();
          
        if (error) throw error;
        return result;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Success",
        description: isEditing ? "Session updated successfully" : "Session created successfully",
      });
      if (!isEditing) {
        form.reset();
      }
      setPhotoFile(null);
      setDeleteExistingPhoto(false);
      onToggle();
    },
    onError: (error: any) => {
      console.error("Session mutation error:", error);
      const errorMessage = error?.message || `Failed to ${isEditing ? 'update' : 'create'} session`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSession) => {
    sessionMutation.mutate(data);
  };



  return (
    <Card>
      <div 
        className="p-6 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
      >
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Plus className="mr-2 text-primary" size={20} />
            {isEditing ? 'Edit Shooting Session' : 'New Shooting Session'}
          </h3>
          <ChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </div>
      </div>
      
      {isOpen && (
        <CardContent className="p-6 bg-slate-50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Morning Practice Session" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl>
                        <Input type="date" className="max-w-40" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Equipment Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rifle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rifle *</FormLabel>
                      <FormControl>
                        <Input placeholder="Remington 700" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="calibre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calibre *</FormLabel>
                      <FormControl>
                        <Input placeholder=".308 Win" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bullet_weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bullet Weight (gr) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          inputMode="numeric"
                          placeholder="168" 
                          {...field}
                          value={field.value === 0 ? "" : field.value || ""}
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : 0)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Range & Scope Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (yards) *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select distance" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                          <SelectItem value="300">300</SelectItem>
                          <SelectItem value="400">400</SelectItem>
                          <SelectItem value="500">500</SelectItem>
                          <SelectItem value="600">600</SelectItem>
                          <SelectItem value="700">700</SelectItem>
                          <SelectItem value="800">800</SelectItem>
                          <SelectItem value="900">900</SelectItem>
                          <SelectItem value="1000">1000</SelectItem>
                          <SelectItem value="1200">1200</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="elevation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Elevation (MOA)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.25"
                          inputMode="decimal"
                          placeholder="2.5" 
                          value={field.value === 0 ? "" : field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : "")} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="windage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Windage (MOA)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.25"
                          inputMode="decimal"
                          placeholder="0.75" 
                          value={field.value === 0 ? "" : field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : "")} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Scoring Section */}
              <ScoringSection form={form} />

              {/* Photo Upload */}
              <PhotoUpload 
                onFileSelect={setPhotoFile} 
                existingPhotoUrl={editSession?.photo_url}
                onDeletePhoto={() => setDeleteExistingPhoto(true)}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        placeholder="Weather conditions, equipment adjustments, observations..." 
                        className="resize-none"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onToggle}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sessionMutation.isPending}>
                  <Save className="mr-2" size={16} />
                  {sessionMutation.isPending ? 'Saving...' : (isEditing ? 'Update Session' : 'Save Session')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
}
