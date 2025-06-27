interface AnimatedButtonProps {
  onClick: () => void;
}

export function AnimatedButton({ onClick }: AnimatedButtonProps) {
  return (
    <button
      onClick={onClick}
      className="min-w-[200px] h-[68px] px-5 py-4 rounded-2xl text-white font-semibold text-lg flex items-center justify-center hover:scale-105 transition-transform duration-300"
      style={{
        background: '#3a3a3a',
        boxShadow: '12px 12px 24px #323232, -12px -12px 24px #484848'
      }}
    >
      LET'S ROLL
    </button>
  );
}