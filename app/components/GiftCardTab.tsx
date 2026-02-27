"use client";

import React, { useState } from 'react';

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
  
  const[isIssueOpen, setIsIssueOpen] = useState(false);
  const[isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  
  const[isMemberMode, setIsMemberMode] = useState(true);
  const [showManualInput, setShowManualInput] = useState(false); 
  
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
      setShowManualInput(false);
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
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900">Gift Card Registry</h3>
          <p className="text-sm font-bold text-slate-600">Spreadsheet view of all store credit issued to members and guests.</p>
        </div>
        <button
          onClick={() => setIsIssueOpen(true)}
          className="flex items-center justify-center gap-2 bg-green-800 hover:bg-green-900 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg"
        >
          <span>➕</span> Issue Gift Card
        </button>
      </div>

      {/* Spreadsheet Table View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-100/80 border-b border-slate-300 text-slate-600 font-black text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Card Code</th>
                <th className="px-6 py-4">Holder</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date Issued</th>
                <th className="px-6 py-4 text-right">Original Amt</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {giftCards.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="text-4xl mb-2 opacity-50">🎟️</div>
                    <p className="font-bold">No gift cards issued yet.</p>
                  </td>
                </tr>
              ) : (
                giftCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-black text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-xs uppercase tracking-tight">
                        {card.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      {card.member ? `${card.member.firstName} ${card.member.lastName}` : card.recipientName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest ${card.member ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>
                        {card.member ? 'MEMBER' : 'GUEST'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-500">
                      {new Date(card.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-400">
                      ${card.initialAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {card.remainingBalance <= 0 ? (
                        <span className="text-red-700 font-black bg-red-50 border border-red-100 px-2.5 py-1 rounded text-sm">$0.00</span>
                      ) : (
                        <span className="text-slate-900 font-black text-sm">${card.remainingBalance.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedCard(card);
                          setIsRedeemOpen(true);
                        }}
                        disabled={card.remainingBalance <= 0}
                        className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm mx-auto block"
                      >
                        Redeem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISSUE MODAL */}
      {isIssueOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h4 className="font-black text-slate-900 text-xl">Issue Credit</h4>
              <button onClick={() => setIsIssueOpen(false)} className="text-slate-500 hover:text-slate-900 text-xl font-black transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-8 space-y-6">
              
              <div className="flex p-1.5 bg-slate-200 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setIsMemberMode(true); setShowManualInput(false); setIssueForm({...issueForm, recipientName: '', memberId: ''}); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${isMemberMode ? 'bg-white shadow-md text-green-900' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <span>👤</span> Member
                </button>
                <button
                  type="button"
                  onClick={() => { setIsMemberMode(false); setShowManualInput(false); setIssueForm({...issueForm, recipientName: '', memberId: ''}); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all ${!isMemberMode ? 'bg-white shadow-md text-green-900' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  <span>👤+</span> Guest
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase mb-2 ml-1">Card Code</label>
                <div className="flex gap-2">
                  <input
                    required
                    value={issueForm.code}
                    onChange={(e) => setIssueForm({ ...issueForm, code: e.target.value.toUpperCase() })}
                    className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm font-mono focus:border-green-600 focus:ring-0 outline-none text-slate-900 font-bold placeholder-slate-400"
                    placeholder="SS-XXXXXX"
                  />
                  <button type="button" onClick={generateCode} className="text-sm font-black text-green-800 px-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-green-200">Auto</button>
                </div>
              </div>

              {isMemberMode ? (
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase mb-2 ml-1">Member</label>
                  
                  {showManualInput ? (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-2">
                      <input
                        required
                        autoFocus
                        className="flex-1 bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-green-600 focus:ring-0 outline-none text-slate-900 font-bold placeholder-slate-400"
                        placeholder="Type member name manually..."
                        value={issueForm.recipientName}
                        onChange={(e) => setIssueForm({ ...issueForm, recipientName: e.target.value, memberId: '' })}
                      />
                      <button
                        type="button"
                        onClick={() => { setShowManualInput(false); setIssueForm({ ...issueForm, recipientName: '' }); }}
                        className="text-xs font-black text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-xl px-4 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-0 text-slate-900 font-bold cursor-pointer"
                      value={issueForm.memberId}
                      onChange={(e) => {
                        if (e.target.value === 'MANUAL') {
                          setShowManualInput(true);
                          setIssueForm({ ...issueForm, memberId: '', recipientName: '' });
                        } else {
                          setIssueForm({ ...issueForm, memberId: e.target.value, recipientName: '' });
                        }
                      }}
                    >
                      <option value="" className="text-slate-500">Select Member...</option>
                      <option value="MANUAL" className="font-black text-green-700 bg-green-50">➕ Not listed? Type name manually...</option>
                      {members.map((m: any) => (
                        <option key={m.id} value={m.id} className="text-slate-900 font-bold">{m.firstName} {m.lastName}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase mb-2 ml-1">Recipient Name</label>
                  <input
                    required
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-0 text-slate-900 font-bold placeholder-slate-400"
                    placeholder="e.g. Guest Name"
                    value={issueForm.recipientName}
                    onChange={(e) => setIssueForm({ ...issueForm, recipientName: e.target.value, memberId: '' })}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase mb-2 ml-1">Amount ($)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="1"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 text-xl outline-none focus:border-green-600 focus:ring-0 text-slate-900 font-black placeholder-slate-300"
                  placeholder="0.00"
                  value={issueForm.amount}
                  onChange={(e) => setIssueForm({ ...issueForm, amount: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-800 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-900/20 hover:bg-green-900 transition-all flex items-center justify-center gap-2 mt-4"
              >
                Issue Gift Card <span>➡️</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* REDEEM MODAL */}
      {isRedeemOpen && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-slate-200">
            <div className="bg-green-800 p-10 text-white text-center">
              <div className="text-5xl opacity-50 mx-auto mb-4 drop-shadow-md">🎟️</div>
              <h4 className="text-3xl font-black uppercase tracking-tight">Redeem</h4>
              <p className="text-green-100 font-bold mt-1">Available: ${selectedCard.remainingBalance.toFixed(2)}</p>
            </div>
            
            <form onSubmit={handleRedeemSubmit} className="p-10">
              <div className="mb-8">
                <label className="block text-center text-xs font-black text-slate-500 uppercase mb-3">Amount to Deduct</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-3xl">$</span>
                  <input
                    required
                    autoFocus
                    type="number"
                    step="0.01"
                    max={selectedCard.remainingBalance}
                    className="w-full border-4 border-slate-200 rounded-[24px] py-6 px-12 text-4xl font-black text-center text-slate-900 focus:border-green-600 focus:ring-0 outline-none transition-all placeholder-slate-300"
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
                  className="py-4 rounded-2xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!redeemAmount || parseFloat(redeemAmount) <= 0 || parseFloat(redeemAmount) > parseFloat(selectedCard.remainingBalance.toFixed(2))}
                  className="bg-green-800 text-white py-4 rounded-2xl font-black text-lg hover:bg-green-900 disabled:opacity-50 disabled:bg-slate-300 shadow-xl shadow-green-900/20 transition-all"
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