"use client";

import React, { useState } from 'react';
import { Plus, Ticket, X, User, UserPlus, CreditCard, ArrowRightCircle, AlertCircle, Search } from 'lucide-react';

interface GiftCardTabProps {
  appState: {
    members: any[];
    giftCards: any[];
    handleIssueGiftCard: (data: any) => Promise<{ success: boolean }>;
    handleRedeemCard: (id: number, amount: number) => Promise<{ success: boolean }>;
    isLoading: boolean;
  };
}

export default function GiftCardTab({ appState }: GiftCardTabProps) {
  const { members, giftCards, handleIssueGiftCard, handleRedeemCard } = appState;
  
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  
  const [isMemberMode, setIsMemberMode] = useState(true);
  const [issueForm, setIssueForm] = useState({
    code: '',
    amount: '',
    memberId: '',
    recipientName: ''
  });

  const generateCode = () => {
    const code = 'SS-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    setIssueForm({ ...issueForm, code });
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await handleIssueGiftCard(issueForm);
    if (res.success) {
      setIsIssueOpen(false);
      setIssueForm({ code: '', amount: '', memberId: '', recipientName: '' });
    }
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    const res = await handleRedeemCard(selectedCard.id, parseFloat(redeemAmount));
    if (res.success) {
      setIsRedeemOpen(false);
      setRedeemAmount('');
      setSelectedCard(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Gift Card Registry</h3>
          <p className="text-sm text-slate-500">Manage balances and issue store credit to members and guests.</p>
        </div>
        <button
          onClick={() => setIsIssueOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} />
          Issue Gift Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {giftCards.map((card) => (
          <div key={card.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Ticket size={64} />
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200 uppercase">
                {card.code}
              </div>
              {card.remainingBalance === 0 && (
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded">DEPLETED</span>
              )}
            </div>

            <div className="mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Holder</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-lg">
                  {card.member ? `${card.member.firstName} ${card.member.lastName}` : card.recipientName}
                </span>
                {card.member && (
                  <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">MEMBER</span>
                )}
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-slate-50 pt-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                <p className="text-3xl font-black text-slate-900">${card.remainingBalance.toFixed(2)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCard(card);
                  setIsRedeemOpen(true);
                }}
                disabled={card.remainingBalance <= 0}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-300 transition-colors"
              >
                Redeem
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ISSUE MODAL */}
      {isIssueOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h4 className="font-black text-slate-800 text-xl">Issue Credit</h4>
              <button onClick={() => setIsIssueOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-8 space-y-5">
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setIsMemberMode(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${isMemberMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <User size={14} /> Member
                </button>
                <button
                  type="button"
                  onClick={() => setIsMemberMode(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all ${!isMemberMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <UserPlus size={14} /> Guest
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Card Code</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={issueForm.code}
                    onChange={(e) => setIssueForm({ ...issueForm, code: e.target.value.toUpperCase() })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="SS-XXXXXX"
                  />
                  <button type="button" onClick={generateCode} className="text-xs font-bold text-indigo-600 px-3 hover:bg-indigo-50 rounded-xl">Auto</button>
                </div>
              </div>

              {isMemberMode ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Member</label>
                  <select
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    value={issueForm.memberId}
                    onChange={(e) => setIssueForm({ ...issueForm, memberId: e.target.value, recipientName: '' })}
                  >
                    <option value="">Select Member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Recipient Name</label>
                  <input
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Guest Name"
                    value={issueForm.recipientName}
                    onChange={(e) => setIssueForm({ ...issueForm, recipientName: e.target.value, memberId: '' })}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-indigo-500 font-black"
                  placeholder="0.00"
                  value={issueForm.amount}
                  onChange={(e) => setIssueForm({ ...issueForm, amount: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                Issue Gift Card
                <ArrowRightCircle size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REDEEM MODAL */}
      {isRedeemOpen && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-indigo-600 p-10 text-white text-center">
              <Ticket size={48} className="mx-auto mb-4 opacity-40" />
              <h4 className="text-2xl font-black uppercase tracking-tight">Redeem</h4>
              <p className="text-indigo-100 text-sm">Max: ${selectedCard.remainingBalance.toFixed(2)}</p>
            </div>
            
            <form onSubmit={handleRedeemSubmit} className="p-10">
              <div className="mb-8">
                <label className="block text-center text-xs font-bold text-slate-400 uppercase mb-3">Redemption Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-2xl">$</span>
                  <input
                    required
                    autoFocus
                    type="number"
                    step="0.01"
                    max={selectedCard.remainingBalance}
                    className="w-full border-2 border-slate-100 rounded-[24px] py-6 px-10 text-4xl font-black text-center focus:border-indigo-500 outline-none transition-all"
                    placeholder="0.00"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsRedeemOpen(false)}
                  className="py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || parseFloat(redeemAmount) > selectedCard.remainingBalance}
                  className="bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}