import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/supabase";

type Session = Database['public']['Tables']['sessions']['Row'];

interface DeleteSessionDialogProps {
  session: Session | null;
  onClose: () => void;
}

export default function DeleteSessionDialog({ session, onClose }: DeleteSessionDialogProps) {
  const { toast } = useToast();

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast({
        title: "Success",
        description: "Session deleted successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to delete session";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (session) {
      deleteSessionMutation.mutate(session.id);
    }
  };

  return (
    <AlertDialog open={!!session} onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Session</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{session?.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteSessionMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteSessionMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}