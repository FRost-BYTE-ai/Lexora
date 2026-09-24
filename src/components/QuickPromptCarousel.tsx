import React from 'react';

interface QuickPromptCarouselProps {
  onSelectPrompt: (promptText: string) => void;
}

export const QuickPromptCarousel: React.FC<QuickPromptCarouselProps> = ({
  onSelectPrompt
}) => {
  const prompts = [
    {
      label: '🌾 PMFBY Crop Loss Appeal',
      text: 'How to appeal against PMFBY crop insurance claim rejection before DGRC Collector committee within 72 hours?'
    },
    {
      label: '🏛 PACS Member Rights (Sec 21)',
      text: 'What are my statutory rights if a PACS denies membership under Section 21 of TN Cooperative Societies Act?'
    },
    {
      label: '🚨 Assault & FIR under BNS/BNSS',
      text: 'What is the mandatory legal procedure to register a Zero FIR under Section 173 BNSS for assault under BNS?'
    },
    {
      label: '🏠 Tenant Notice',
      text: 'What is the mandatory statutory notice period and grounds for tenant eviction under TN Tenancy Act 2017?'
    }
  ];

  return (
    <div className="w-full mt-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="text-[11px] font-bold text-[#6B7280] dark:text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
          QUICK PROMPTS::
        </span>
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(p.text)}
            className="text-xs font-medium text-[#17244F] dark:text-slate-200 bg-white dark:bg-[#101728] hover:bg-slate-50 dark:hover:bg-slate-800 border border-[#E7E5E0] dark:border-slate-800 px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shadow-2xs hover:border-[#37318F]"
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* Subtle scroll track indicator line */}
      <div className="w-48 h-0.5 bg-[#E7E5E0] dark:bg-slate-800 rounded-full mx-auto mt-1 opacity-70" />
    </div>
  );
};
