import { UseFormReturn } from "react-hook-form";
import { Target } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateScore } from "@/lib/scoring";
import type { InsertSession } from "@shared/schema";

interface ScoringSectionProps {
  form: UseFormReturn<InsertSession>;
}

export default function ScoringSection({ form }: ScoringSectionProps) {
  const shots = form.watch("shots");
  
  const { totalScore, vCount } = calculateScore(shots);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h4 className="text-md font-semibold text-slate-900 mb-4 flex items-center">
        <Target className="mr-2 text-primary" size={20} />
        Scoring (12 Shots)
      </h4>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        {Array.from({ length: 12 }, (_, index) => (
          <FormField
            key={index}
            control={form.control}
            name={`shots.${index}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-600">
                  Shot {index + 1}
                </FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'none' ? '' : value)} value={field.value?.toString() || 'none'}>
                  <FormControl>
                    <SelectTrigger className="w-full px-2 py-1 text-sm">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">-</SelectItem>
                    <SelectItem value="0">0</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="V">V</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        ))}
      </div>
      
      {/* Score Display */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex space-x-6">
          <div>
            <p className="text-sm font-medium text-slate-600">Total Score</p>
            <p className="text-2xl font-bold text-slate-900">{totalScore}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">V Count</p>
            <p className="text-2xl font-bold text-violet-600">{vCount}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Auto-calculated</p>
          <p className="text-sm font-medium text-slate-600">V = 5 points</p>
        </div>
      </div>
    </div>
  );
}