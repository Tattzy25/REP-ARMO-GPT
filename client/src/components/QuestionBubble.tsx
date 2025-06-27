interface QuestionBubbleProps {
  question: string;
}

export function QuestionBubble({ question }: QuestionBubbleProps) {
  return (
    <div className="relative">
      <svg style={{position: 'absolute', width: 0, height: 0}}>
        <filter width="3000%" x="-1000%" height="3000%" y="-1000%" id="unopaq">
          <feColorMatrix values="1 0 0 0 0 
          0 1 0 0 0 
          0 0 1 0 0 
          0 0 0 3 0" />
        </filter>
      </svg>
      
      <div 
        className="relative min-w-[300px] min-h-[80px] rounded-[40px] flex items-center justify-center px-8 py-5 text-white font-semibold text-lg text-center leading-relaxed"
        style={{
          background: '#3a3a3a',
          boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
        }}
      >
        {question}
      </div>
    </div>
  );
}