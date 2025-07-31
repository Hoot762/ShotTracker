import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSessionSchema, type InsertSession } from "@shared/schema";
import ScoringSection from "@/components/scoring-section";
import PhotoUpload from "@/components/photo-upload";

interface SessionFormProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function SessionForm({ isOpen, onToggle }: SessionFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSession>({
    resolver: zodResolver(insertSessionSchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split('T')[0],
      rifle: "",
      calibre: "",
      bulletWeight: 0,
      distance: 100,
      elevation: undefined,
      windage: undefined,
      shots: Array(12).fill(""),
      notes: "",
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: InsertSession) => {
      // Transform the data to ensure proper types
      const transformedData = {
        ...data,
        bulletWeight: Number(data.bulletWeight) || 0,
        distance: Number(data.distance) || 100,
        elevation: data.elevation ? Number(data.elevation) : null,
        windage: data.windage ? Number(data.windage) : null,
      };

      if (photoFile) {
        const formData = new FormData();
        formData.append('sessionData', JSON.stringify(transformedData));
        formData.append('photo', photoFile);
        return apiRequest('POST', '/api/sessions', formData);
      } else {
        return apiRequest('POST', '/api/sessions', transformedData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      toast({
        title: "Success",
        description: "Session created successfully",
      });
      form.reset();
      setPhotoFile(null);
      onToggle();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSession) => {
    createSessionMutation.mutate(data);
  };

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <Button variant="ghost" onClick={onToggle} className="flex items-center justify-between w-full text-left p-0">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Plus className="mr-2 text-primary" size={20} />
            New Shooting Session
          </h3>
          <ChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </Button>
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
                        <Input type="date" {...field} />
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
                  name="bulletWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bullet Weight (gr) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="168" 
                          value={field.value === 0 ? "" : field.value || ""} 
                          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : "")} 
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
              <PhotoUpload onFileSelect={setPhotoFile} />

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
                <Button type="submit" disabled={createSessionMutation.isPending}>
                  <Save className="mr-2" size={16} />
                  {createSessionMutation.isPending ? 'Saving...' : 'Save Session'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
}
