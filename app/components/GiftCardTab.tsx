// filepath: app/components/GiftCardTab.tsx
"use client";
import React, { useState, useMemo } from 'react';
import { GiftCard, Member } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { notify } from '@/lib/ui-utils';
import { Plus, Search, CreditCard, User, History, Trash2, ArrowRight } from 'lucide-react';

export default function GiftCardTab({ appState }: any) {
  const giftCards = useAppStore(state => state.giftCards);
  const members = useAppStore(state => state.members);
  const fetchGiftCards = useAppStore(state => state.fetchGiftCards);
  const isGiftCardsLoading = useAppStore(state => state.isGiftCardsLoading);

  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [searchQuery, setSearchSearchQuery] = useState('');
  
  const [isMemberMode, setIsMemberMode] = useState(true);
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
    try {
      const res = await fetch('/api/giftcards', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(issueForm) 
      });
      if (res.ok) {
        notify.success("Card Issued!");
        setIsIssueOpen(false);
        setIssueForm({ code: '', amount: '', memberId: '', recipientName: '' });
        setShowManualInput(false);
        await fetchGiftCards();
      } else {
        notify.error("Failed to issue card.");
      }
    } catch (err) {
      notify.error("Network error.");
    }
  };

  const handleRedeemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    try {
      const res = await fetch(`/api/giftcards/${selectedCard.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ redemptionAmount: parseFloat(redeemAmount) }) 
      });
      if (res.ok) {
        notify.success("Card Redeemed!");
        setIsRedeemOpen(false);
        setRedeemAmount('');
        setSelectedCard(null);
        await fetchGiftCards();
      } else {
        const errorData = await res.json();
        notify.error(errorData.error || "Failed to redeem card.");
      }
    } catch (err) {
      notify.error("Network error.");
    }
  };

  const filteredCards = useMemo(() => {
    if (!searchQuery) return giftCards;
    const s = searchQuery.toLowerCase();
    return giftCards.filter(c => 
      c.code.toLowerCase().includes(s) || 
      (c.member && `${c.member.firstName} ${c.member.lastName}`.toLowerCase().includes(s)) ||
      (c.recipientName && c.recipientName.toLowerCase().includes(s))
    );
  }, [giftCards, searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 sports-slant tracking-tight uppercase italic mb-2">Gift Card Registry</h2>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Manage store credits and member vouchers</p>
        </div>
        <button 
          onClick={() => setIsIssueOpen(true)} 
          className="btn-sport bg-green-700 text-white border-b-4 border-green-900 px-8 py-4 text-base shadow-xl active:scale-95"
        >
          <Plus size={20} className="mr-2 stroke-[3px]" /> Issue New Card
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="SEARCH BY NAME OR CARD CODE..." 
          value={searchQuery}
          onChange={(e) => setSearchSearchQuery(e.target.value)}
          className="w-full bg-white border-4 border-slate-200 rounded-2xl py-5 pl-12 pr-4 text-lg font-black text-slate-900 placeholder:text-slate-300 focus:border-blue-600 outline-none transition-all shadow-sm"
        />
      </div>

      {isGiftCardsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-100 rounded-3xl border-4 border-slate-200" />)}
        </div>
      ) : filteredCards?.length === 0 ? (
        <div className="bg-slate-50 rounded-[32px] border-4 border-dashed border-slate-200 p-20 text-center">
          <CreditCard size={64} className="mx-auto text-slate-200 mb-4" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xl sports-slant">No matching cards found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {filteredCards?.map((card: GiftCard) => (
            <div 
              key={card.id} 
              className={`group relative bg-white border-4 rounded-[32px] p-6 shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden ${card.remainingBalance <= 0 ? 'border-slate-100 grayscale' : 'border-slate-900 hover:-translate-y-1'}`}
            >
              {/* Card Status Indicator */}
              <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest ${card.remainingBalance <= 0 ? 'bg-slate-200 text-slate-500' : 'bg-brand-yellow text-slate-900'}`}>
                {card.remainingBalance <= 0 ? 'Exhausted' : 'Active'}
              </div>

              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-slate-100 px-3 py-1 rounded-lg border-2 border-slate-200">
                    <span className="font-mono font-black text-xs text-slate-600 uppercase tracking-tighter">{card.code}</span>
                  </div>
                </div>

                <div className="mb-auto">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Card Holder</p>
                  <h4 className="text-xl font-black text-slate-900 truncate uppercase">
                    {card.member ? `${card.member.firstName} ${card.member.lastName}` : (card.recipientName || 'Guest')}
                  </h4>
                  {card.member && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-green-100">
                      Platinum Member
                    </span>
                  )}
                </div>

                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Balance</p>
                    <div className="text-4xl font-black text-slate-900 sports-slant">
                      ${card.remainingBalance.toFixed(2)}
                    </div>
                  </div>
                  
                  {card.remainingBalance > 0 && (
                    <button 
                      onClick={() => { setSelectedCard(card); setIsRedeemOpen(true); }}
                      className="btn-sport bg-slate-900 text-white px-5 py-2.5 text-xs border-b-4 border-slate-700 hover:bg-black"
                    >
                      Redeem <ArrowRight size={14} className="ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redemption Modal */}
      {isRedeemOpen && selectedCard && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-10 max-w-md w-full animate-in zoom-in duration-300 border-8 border-slate-900">
            <div className="text-center mb-8">
               <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-900 shadow-lg">
                  <CreditCard size={32} className="text-slate-900" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase sports-slant tracking-tighter">Redeem Credit</h3>
               <p className="text-sm font-bold text-slate-500 mt-1">Current: <span className="text-slate-900">${selectedCard.remainingBalance.toFixed(2)}</span></p>
            </div>
            
            <form onSubmit={handleRedeemSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Purchase Amount ($)</label>
                <input 
                  type="number" step="0.01" required autoFocus
                  value={redeemAmount} onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-5 text-3xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all text-center"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setIsRedeemOpen(false); setSelectedCard(null); }} className="flex-1 btn-sport bg-slate-100 text-slate-500 border-b-4 border-slate-200">Cancel</button>
                <button type="submit" className="flex-[2] btn-sport bg-green-700 text-white border-b-4 border-green-900">Confirm Use</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Card Modal */}
      {isIssueOpen && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex justify-center items-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 max-w-xl w-full animate-in slide-in-from-bottom-10 duration-500 border-8 border-slate-900">
            <h3 className="text-3xl font-black text-slate-900 uppercase sports-slant italic mb-8 border-b-4 border-slate-100 pb-4">Issue Gift Card</h3>
            
            <form onSubmit={handleIssueSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Card Number</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" required value={issueForm.code} 
                      onChange={(e) => setIssueForm({...issueForm, code: e.target.value.toUpperCase()})}
                      className="flex-1 border-4 border-slate-100 bg-slate-50 rounded-2xl p-4 font-mono font-black text-slate-900 focus:border-blue-600 outline-none"
                      placeholder="SS-XXXXXXX"
                    />
                    <button type="button" onClick={generateCode} className="btn-sport bg-slate-900 text-white px-4 border-b-4 border-slate-700">Auto</button>
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Initial Value ($)</label>
                  <input 
                    type="number" required value={issueForm.amount}
                    onChange={(e) => setIssueForm({...issueForm, amount: e.target.value})}
                    className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-4 text-xl font-black focus:border-blue-600 outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-1 flex flex-col justify-end">
                   <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                      <button type="button" onClick={() => setIsMemberMode(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isMemberMode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Member</button>
                      <button type="button" onClick={() => setIsMemberMode(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isMemberMode ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Guest</button>
                   </div>
                </div>

                <div className="col-span-2 pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Recipient</label>
                  {isMemberMode ? (
                    <select 
                      required value={issueForm.memberId}
                      onChange={(e) => setIssueForm({...issueForm, memberId: e.target.value, recipientName: ''})}
                      className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-4 text-sm font-black focus:border-blue-600 outline-none appearance-none"
                    >
                      <option value="">Select Member...</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  ) : (
                    <input 
                      type="text" required value={issueForm.recipientName}
                      onChange={(e) => setIssueForm({...issueForm, recipientName: e.target.value, memberId: ''})}
                      className="w-full border-4 border-slate-100 bg-slate-50 rounded-2xl p-4 text-sm font-black focus:border-blue-600 outline-none"
                      placeholder="Enter Guest Name..."
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsIssueOpen(false)} className="flex-1 btn-sport bg-slate-100 text-slate-500 border-b-4 border-slate-200">Discard</button>
                <button type="submit" className="flex-[2] btn-sport bg-slate-900 text-white border-b-4 border-slate-700">Issue Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}