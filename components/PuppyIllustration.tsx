import Image from "next/image";

export default function PuppyIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto aspect-[16/9] w-full max-w-sm overflow-hidden rounded-3xl ${className}`}>
      <Image
        src="/images/default-dog-avatar.png"
        alt="白色雪纳瑞可爱头像"
        fill
        priority
        sizes="(max-width: 640px) 100vw, 384px"
        className="object-cover object-[center_42%]"
      />
    </div>
  );
}
