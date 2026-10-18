import React, { useState } from 'react';
import { Crown, Shield, Eye, MoreVertical, UserX, ArrowRightCircle, Check } from 'lucide-react';

export function ParticipantList({ participants, currentUserId, currentRole, onAssignRole, onRemoveParticipant, onTransferHost }) {
  const isHost = currentRole === 'host';
  const [openMenuId, setOpenMenuId] = useState(null);
  const [confirmKickId, setConfirmKickId] = useState(null);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'host':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-medium">
            <Crown className="w-3 h-3 text-amber-400" />
            <span>Host</span>
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-medium">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Moderator</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-medium">
            <Eye className="w-3 h-3 text-slate-400" />
            <span>Participant</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-2.5 bg-[#070913]">
      {participants.map((p) => {
        const isMenuOpen = openMenuId === p.userId;
        const isKickConfirm = confirmKickId === p.userId;

        return (
          <div key={p.userId} className="relative flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-md">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
                  {p.username ? p.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              
              <div className="text-left">
                <span className="text-xs font-bold text-slate-100 block truncate max-w-[120px]">
                  {p.username} {p.userId === currentUserId && <span className="text-slate-400 font-normal">(You)</span>}
                </span>
                <div className="mt-0.5">{getRoleBadge(p.role)}</div>
              </div>
            </div>

            {/* Host Action Popover Menu */}
            {isHost && p.userId !== currentUserId && (
              <div className="relative">
                <button
                  onClick={() => {
                    setOpenMenuId(isMenuOpen ? null : p.userId);
                    setConfirmKickId(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-8 w-44 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-30 backdrop-blur-2xl">
                    {p.role === 'participant' ? (
                      <button
                        onClick={() => {
                          onAssignRole(p.userId, 'moderator');
                          setOpenMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-cyan-400 hover:bg-cyan-950/40 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Make Moderator</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onAssignRole(p.userId, 'participant');
                          setOpenMenuId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs text-slate-400 hover:bg-slate-900 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Demote to Participant</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onTransferHost(p.userId);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-amber-400 hover:bg-amber-950/40 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <ArrowRightCircle className="w-3.5 h-3.5" />
                      <span>Transfer Host</span>
                    </button>

                    <div className="h-[1px] bg-slate-800/80 my-1" />

                    {!isKickConfirm ? (
                      <button
                        onClick={() => setConfirmKickId(p.userId)}
                        className="w-full px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Remove Participant</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onRemoveParticipant(p.userId);
                          setOpenMenuId(null);
                          setConfirmKickId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Confirm Kick?</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}