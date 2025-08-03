import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Target, Minus, Plus } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calculateScore } from "@/lib/scoring";
import type { InsertSession } from "@shared/schema";

interface ScoringSectionProps {
  form: UseFormReturn<InsertSession>;
}

export default function ScoringSection({ form }: ScoringSectionProps) {
  const [markersRemoved, setMarkersRemoved] = useState(false);
  const shots = form.watch("shots");
  
  const { totalScore, vCount } = calculateScore(shots);
  
  // Calculate adjusted score and V-count based on markers state
  const getAdjustedValues = () => {
    if (!markersRemoved) return { score: totalScore, vCount: vCount };
    
    // Calculate shot 1 and shot 2 values and V counts
    const shot1Value = shots[0] === 'V' ? 5 : (Number(shots[0]) || 0);
    const shot2Value = shots[1] === 'V' ? 5 : (Number(shots[1]) || 0);
    const shot1IsV = shots[0] === 'V';
    const shot2IsV = shots[1] === 'V';
    
    const adjustedScore = Math.max(0, totalScore - shot1Value - shot2Value);
    const adjustedVCount = vCount - (shot1IsV ? 1 : 0) - (shot2IsV ? 1 : 0);
    
    return { score: adjustedScore, vCount: Math.max(0, adjustedVCount) };
  };
  
  const { score: adjustedScore, vCount: adjustedVCount } = getAdjustedValues();
  
  const handleToggleMarkers = () => {
    setMarkersRemoved(!markersRemoved);
  };

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
            <p className="text-2xl font-bold text-slate-900">{adjustedScore}</p>
            {markersRemoved && (
              <p className="text-xs text-orange-600">Markers removed (-{totalScore - adjustedScore})</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600">V Count</p>
            <p className="text-2xl font-bold text-violet-600">{adjustedVCount}</p>
            {markersRemoved && adjustedVCount !== vCount && (
              <p className="text-xs text-orange-600">V's removed (-{vCount - adjustedVCount})</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Auto-calculated</p>
          <p className="text-sm font-medium text-slate-600">V = 5 points</p>
        </div>
      </div>

      {/* Remove/Add Markers Button */}
      <div className="mt-4 flex justify-center">
        <Button 
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleMarkers}
          className="flex items-center space-x-2"
        >
          {markersRemoved ? (
            <>
              <Plus size={16} />
              <span>Add Markers</span>
            </>
          ) : (
            <>
              <Minus size={16} />
              <span>Remove Markers</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}