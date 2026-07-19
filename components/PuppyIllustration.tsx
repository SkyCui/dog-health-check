export default function PuppyIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto h-56 w-full max-w-sm ${className}`} aria-hidden="true">
      <span className="absolute left-4 top-10 rotate-[-18deg] text-4xl drop-shadow-sm">🦴</span>
      <span className="absolute right-4 top-2 rotate-[18deg] text-4xl drop-shadow-sm">⭐</span>
      <span className="absolute bottom-8 left-10 rotate-[12deg] text-4xl drop-shadow-sm">🍪</span>
      <span className="absolute bottom-10 right-12 rotate-[-10deg] text-4xl drop-shadow-sm">🧸</span>
      <div className="absolute left-1/2 top-7 h-36 w-44 -translate-x-1/2 rounded-[48%_48%_42%_42%] border-[5px] border-[#6d4436] bg-white shadow-[0_18px_0_#f6d2a8]">
        <div className="absolute -left-8 top-3 h-24 w-16 rotate-[-28deg] rounded-[60%_50%_70%_50%] bg-[#9a6a4e]" />
        <div className="absolute -right-8 top-3 h-24 w-16 rotate-[28deg] rounded-[50%_60%_50%_70%] bg-[#9a6a4e]" />
        <div className="absolute left-12 top-16 h-3.5 w-3.5 rounded-full bg-[#402922]" />
        <div className="absolute right-12 top-16 h-3.5 w-3.5 rounded-full bg-[#402922]" />
        <div className="absolute left-1/2 top-[86px] h-5 w-7 -translate-x-1/2 rounded-full bg-[#402922]" />
        <div className="absolute left-1/2 top-[110px] h-5 w-12 -translate-x-1/2 rounded-b-full border-b-[4px] border-[#402922]" />
        <div className="absolute -right-4 top-0 grid h-12 w-12 place-items-center rounded-full bg-goldSoft text-xl shadow-panel">💗</div>
      </div>
    </div>
  );
}
