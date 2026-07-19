export default function PuppyIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-sm ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 420 250"
        role="img"
        aria-label="原创线条手绘风格小狗插画"
        className="h-auto w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke="#694654" strokeLinecap="round" strokeLinejoin="round">
          <path d="M88 67c-18-17-32-19-42-10-12 11-5 31 14 45" strokeWidth="5" />
          <path d="M334 67c17-18 31-20 42-11 12 10 7 30-13 45" strokeWidth="5" />

          <path
            d="M122 75c-24 10-42 32-48 60-7 35 4 69 30 88 26 19 67 22 108 21 45 0 84-4 108-24 23-20 32-54 23-87-8-28-28-49-53-59-28-11-61-14-91-13-29 0-55 4-77 14Z"
            fill="#fffdfb"
            strokeWidth="6"
          />
          <path
            d="M128 78c-26 1-49 17-56 40-7 24 5 47 29 55 15 5 28-5 32-22 5-22-1-47-5-73Z"
            fill="#f6cedb"
            strokeWidth="6"
          />
          <path
            d="M289 77c27 1 49 16 56 39 7 23-4 47-28 56-15 5-29-5-33-22-5-22 1-48 5-73Z"
            fill="#f6cedb"
            strokeWidth="6"
          />

          <path d="M153 137c7-7 17-7 24 0" strokeWidth="5" />
          <path d="M243 137c7-7 17-7 24 0" strokeWidth="5" />
          <path d="M197 159c8-7 18-7 26 0-1 10-6 15-13 15-8 0-12-5-13-15Z" fill="#694654" strokeWidth="4" />
          <path d="M210 174c0 18-16 26-31 16" strokeWidth="5" />
          <path d="M210 174c0 18 16 26 31 16" strokeWidth="5" />
          <path d="M191 196c12 7 27 7 39 0" stroke="#ef8eaa" strokeWidth="4" />

          <path d="M130 211c-11 10-18 22-19 32" strokeWidth="5" />
          <path d="M289 211c12 10 18 21 20 32" strokeWidth="5" />
          <path d="M111 243c25 3 48 3 68 0" strokeWidth="5" />
          <path d="M241 243c21 3 44 3 68 0" strokeWidth="5" />

          <path d="M63 27c4 12 11 19 23 22-12 4-19 11-23 23-4-12-11-19-23-23 12-3 19-10 23-22Z" fill="#fff1a8" stroke="#efb742" strokeWidth="4" />
          <path d="M355 19c2 8 7 13 15 15-8 3-13 8-15 16-3-8-8-13-16-16 8-2 13-7 16-15Z" fill="#fff1a8" stroke="#efb742" strokeWidth="4" />
          <path d="M373 181c-17-14-35 8 0 32 35-24 17-46 0-32Z" fill="#ffd4e2" stroke="#ef8eaa" strokeWidth="4" />
          <path d="M49 184c-5 6-5 13 0 19m-10-10h20" stroke="#ef8eaa" strokeWidth="4" />
        </g>
      </svg>
      <p className="mt-1 text-center text-[11px] font-bold tracking-[0.18em] text-cocoa/45">
        ORIGINAL LINE DRAWING
      </p>
    </div>
  );
}
