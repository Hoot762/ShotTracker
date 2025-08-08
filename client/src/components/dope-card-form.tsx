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
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const insertDopeCardSchema = z.object({
  name: z.string().min(1, "DOPE card name is required"),
  rifle: z.string().min(1, "Rifle is required"),
  calibre: z.string().min(1, "Calibre is required"),
});

type InsertDopeCard = z.infer<typeof insertDopeCardSchema>;

interface DopeCardFormProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function DopeCardForm({ isOpen, onToggle }: DopeCardFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertDopeCard>({
    resolver: zodResolver(insertDopeCardSchema),
    defaultValues: {
      name: "",
      rifle: "",
      calibre: "",
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: InsertDopeCard) => {
      const userId = await getCurrentUserId();
      const { data: result, error } = await supabase
        .from('dope_cards')
        .insert({
          ...data,
          user_id: userId,
        })
        .select()
        .single();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dope-cards'] });
      toast({
        title: "Success",
        description: "DOPE card created successfully",
      });
      form.reset();
      onToggle();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create DOPE card",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertDopeCard) => {
    createCardMutation.mutate(data);
  };

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <Button variant="ghost" onClick={onToggle} className="flex items-center justify-between w-full text-left p-0">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center">
            <Plus className="mr-2 text-primary" size={20} />
            New DOPE Card
          </h3>
          <ChevronDown className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </Button>
      </div>
      
      {isOpen && (
        <CardContent className="p-6 bg-slate-50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DOPE Card Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Remington 700 .308 168gr" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Equipment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onToggle}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCardMutation.isPending}>
                  <Save className="mr-2" size={16} />
                  {createCardMutation.isPending ? 'Creating...' : 'Create DOPE Card'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      )}
    </Card>
  );
}