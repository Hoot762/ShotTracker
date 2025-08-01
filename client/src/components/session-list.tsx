import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid, List, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Session } from "@shared/schema";

interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
  onSessionSelect: (session: Session) => void;
  onSessionEdit: (session: Session) => void;
  onSessionDelete: (session: Session) => void;
}



export default function SessionList({ sessions, isLoading, onSessionSelect, onSessionEdit, onSessionDelete }: SessionListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 border border-slate-200 rounded-lg">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j}>
                      <Skeleton className="h-4 w-16 mb-1" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent Sessions</h3>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Grid size={16} />
            </Button>
            <Button variant="ghost" size="sm">
              <List size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">No sessions found. Create your first session to get started!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {sessions.map((session) => {
              return (
                <div key={session.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onSessionSelect(session)}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-slate-900">{session.name}</h4>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Date</p>
                          <p className="font-medium text-slate-900">
                            {new Date(session.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Rifle</p>
                          <p className="font-medium text-slate-900">{session.rifle}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Distance</p>
                          <p className="font-medium text-slate-900">{session.distance} yards</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Calibre</p>
                          <p className="font-medium text-slate-900">{session.calibre}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-6">
                      {session.photoUrl && (
                        <img
                          src={session.photoUrl}
                          alt="Target photo"
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-900">
                          {session.totalScore}
                        </div>
                        <div className="text-sm text-slate-500">{session.vCount} V's</div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionEdit(session);
                          }}
                          className="p-2 h-8 w-8"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSessionDelete(session);
                          }}
                          className="p-2 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
