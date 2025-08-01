import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Session } from "@shared/schema";

interface SessionDetailModalProps {
  session: Session;
  onClose: () => void;
}

export default function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {session.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Session Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Date</p>
                <p className="font-medium">{new Date(session.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Rifle</p>
                <p className="font-medium">{session.rifle}</p>
              </div>
              <div>
                <p className="text-slate-500">Calibre</p>
                <p className="font-medium">{session.calibre}</p>
              </div>
              <div>
                <p className="text-slate-500">Bullet Weight</p>
                <p className="font-medium">{session.bulletWeight} gr</p>
              </div>
              <div>
                <p className="text-slate-500">Distance</p>
                <p className="font-medium">{session.distance} yards</p>
              </div>
              <div>
                <p className="text-slate-500">Elevation</p>
                <p className="font-medium">{session.elevation || 'N/A'} MOA</p>
              </div>
              <div>
                <p className="text-slate-500">Windage</p>
                <p className="font-medium">{session.windage || 'N/A'} MOA</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Scoring Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Scoring</h3>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {session.shots.map((shot, index) => (
                <div key={index} className="text-center p-2 border rounded">
                  <p className="text-xs text-slate-500">Shot {index + 1}</p>
                  <p className="font-bold text-lg">{shot}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex space-x-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Score</p>
                  <p className="text-2xl font-bold text-slate-900">{session.totalScore}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">V Count</p>
                  <p className="text-2xl font-bold text-violet-600">{session.vCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Photo */}
          {session.photoUrl && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Target Photo</h3>
                <img
                  src={session.photoUrl}
                  alt="Target photo"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            </>
          )}

          {/* Notes */}
          {session.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <p className="text-slate-700 whitespace-pre-wrap">{session.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
