"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { parseAssessmentInput } from "@/lib/assessmentProtocol";
import { loadMemory, petMemoryKey, todayDate } from "@/lib/careMemory";

export default function ReturnVisit() {
  const [welcome, setWelcome] = useState<{ name: string; recorded: boolean } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dogHealthAssessment");
      const input = raw ? parseAssessmentInput(JSON.parse(raw)).input : null;
      if (input) setWelcome({ name: input.dogName || "毛孩子", recorded: loadMemory(petMemoryKey(input)).records.some(record => record.date === todayDate()) });
    } catch { /* The first-visit experience remains available without storage. */ }
  }, []);
  if (!welcome) return null;
  return <section className="return-visit"><div><p className="eyebrow">欢迎回来</p><h2>{welcome.recorded ? `今天已记下${welcome.name}的观察，一起回顾一下？` : `今天的${welcome.name}，和平时有什么不同？`}</h2></div><Link href="/companion" className="primary-link">{welcome.recorded ? "查看陪伴记录" : "记下今天的观察"}<ArrowRight size={17}/></Link></section>;
}
