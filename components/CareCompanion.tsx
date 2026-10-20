"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Download, Upload, Trash2, CheckCircle2, ArrowRight } from "lucide-react";
import { parseAssessmentInput } from "@/lib/assessmentProtocol";
import { generateResult } from "@/lib/generateResult";
import { loadMemory, saveMemory, petMemoryKey, todayDate, parseMemory, downloadFile, weeklyReminder, observationChoices, type DailyRecord, type CareMemory } from "@/lib/careMemory";
import type { AssessmentInput } from "@/lib/types";

export default function CareCompanion() {
  const [input, setInput] = useState<AssessmentInput | null>(null);
  const [memory, setMemory] = useState<CareMemory>({ version: 1, records: [], conversation: [] });
  const [date, setDate] = useState("");
  const [record, setRecord] = useState<DailyRecord>({ date: "", appetite: "没有观察", energy: "没有观察", stool: "没有观察", weight: "", note: "", actionDone: false });
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const upload = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dogHealthAssessment");
      const assessment = raw ? parseAssessmentInput(JSON.parse(raw)).input ?? null : null;
      setInput(assessment);
      const saved = loadMemory(petMemoryKey(assessment)); setMemory(saved);
      const today = todayDate(); setDate(today);
      setRecord(saved.records.find(item => item.date === today) ?? { date: today, appetite: "没有观察", energy: "没有观察", stool: "没有观察", weight: "", note: "", actionDone: false });
    } catch { setMessage("本机资料暂时无法读取，可以重新自查或导入备份。"); }
    setReady(true);
  }, []);
  const result = input ? generateResult(input) : null;
  const supported = result?.supportRoute !== "none" && Boolean(result);
  const action = supported ? result!.supportReminder : result?.todayAction.body;
  function persist(updated: CareMemory) {
    saveMemory(petMemoryKey(input), updated); setMemory(updated);
  }
  function save() {
    if (record.weight && (!Number.isFinite(Number(record.weight)) || Number(record.weight) <= 0 || Number(record.weight) > 200)) { setMessage("体重请填写 0 到 200 之间的 kg 数字。"); return; }
    try { persist({ ...memory, records: [...memory.records.filter(item => item.date !== date), { ...record, date }].sort((a,b) => a.date.localeCompare(b.date)).slice(-180) }); setMessage("今天的观察已保存在这台设备上。"); }
    catch { setMessage("保存失败，浏览器存储空间可能不足。请先导出已有记录。"); }
  }
  async function restore(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setMessage("请选择小于 2MB 的记录备份。"); return; }
    try {
      const imported = parseMemory(JSON.parse(await file.text()));
      const updated = { ...memory, records: [...new Map([...memory.records, ...imported.records].map(item => [item.date,item])).values()].sort((a,b) => a.date.localeCompare(b.date)).slice(-180) };
      persist(updated);
      setRecord(updated.records.find(item => item.date === date) ?? record);
      setMessage("已恢复观察记录；同一天的记录以备份为准。聊天与密钥不会导入。");
    } catch { setMessage("导入失败，请选择本工具导出的观察备份。"); }
  }
  return <main className="page-wrap"><div className="page-heading"><p className="eyebrow">让陪伴有迹可循</p><h1>{input?.dogName || "毛孩子"}的陪伴记录</h1><p>每天留下一点观察，下次复盘不再靠记忆。记录保存在当前浏览器，换设备前请导出备份。</p></div>
    <div className="companion-summary"><div><span>{memory.records.length}</span><p>天有观察记录</p></div><div><span>{memory.records.slice(-7).filter(item => item.actionDone).length}</span><p>最近 7 次记录完成行动</p></div><div><span>{memory.records.filter(item => item.date === date).length ? "已记" : "待记"}</span><p>今天的观察</p></div></div>
    {!input && ready ? <p className="care-notice">先完成<Link href="/assessment" className="underline">幸福自查</Link>，就能把建议和记录放进这只狗狗的档案。当前记录归入“通用观察”。</p> : null}
    <div className="companion-layout"><section className="care-section"><p className="eyebrow">{supported ? "先关注健康安全" : "今天的一件小事"}</p><h2>{supported ? "优先寻求专业支持" : result?.todayAction.title || "先观察，再行动"}</h2><p className="mt-3 leading-7 text-cocoa/75">{action || "记录吃饭、精神与便便是否和它平时相近。不确定时就保留没有观察。"}</p><label className="check-label mt-5"><input type="checkbox" checked={record.actionDone} onChange={e => setRecord({ ...record, actionDone: e.target.checked })}/>{supported ? "已联系或安排专业支持" : "今天已完成这件小事"}</label><Link href="/consult?prompt=review" className="mt-5 inline-flex items-center gap-2 font-bold text-rose">带着记录去复盘 <ArrowRight size={16}/></Link><p className="mt-3 text-xs leading-6 text-cocoa/60">这些记录不会生成诊断或自动改变幸福分数。急症不等记录完成，请及时就医。</p></section>
    <section className="care-section"><h2>今天和它平时相比怎么样？</h2><p className="mt-2 text-xs text-cocoa/60">{date || "正在准备"} · 仅当前档案</p><div className="record-fields">{([["appetite","进食"],["energy","精神"],["stool","便便"]] as const).map(([key,label]) => <label className="field-label" key={key}>{label}<select value={record[key]} onChange={e => setRecord({ ...record, [key]: e.target.value })}>{observationChoices.map(option => <option key={option}>{option}</option>)}</select></label>)}<label className="field-label">体重 kg（可选）<input aria-label="观察体重" type="number" min="0.1" max="200" step="0.1" value={record.weight} onChange={e => setRecord({ ...record, weight: e.target.value })}/></label></div><label className="field-label mt-4">想记住的变化（可选）<textarea value={record.note} maxLength={600} onChange={e => setRecord({ ...record, note: e.target.value })} rows={3} placeholder="什么时候发生、几次、与平时有什么不同…"/></label><button disabled={!ready || !date} onClick={save} className="primary-link mt-5"><CheckCircle2 size={18}/>保存今天的观察</button><p role="status" className="mt-3 text-sm leading-6 text-cocoa/70">{message}</p></section></div>
    <section className="section-band"><div><h2>每周回来，看看变化</h2><p className="mt-2 text-sm leading-6 text-cocoa/65">导入日历后由你的日历提醒；本工具不会发送推送。备份只包含观察记录，不含密钥或照片。</p></div><div className="record-tools"><button title="下载一周后复盘的日历提醒" onClick={() => downloadFile("dogcare-review.ics", weeklyReminder(), "text/calendar")}><CalendarPlus size={17}/>日历提醒</button><button onClick={() => downloadFile("dogcare-observations.json", JSON.stringify({ version: 1, records: memory.records, conversation: [] }, null, 2), "application/json")}><Download size={17}/>导出观察</button><button onClick={() => upload.current?.click()}><Upload size={17}/>恢复备份</button><input hidden ref={upload} type="file" accept=".json,application/json" onChange={e => { restore(e.target.files?.[0]); e.target.value = ""; }}/></div></section>
    <section className="care-timeline"><h2>最近的观察</h2>{memory.records.length ? [...memory.records].reverse().slice(0, 14).map(item => <article key={item.date}><div className="flex flex-wrap items-center justify-between gap-2"><h3>{item.date}</h3><span className="text-xs text-cocoa/60">{item.actionDone ? "已完成行动" : "已记录观察"}</span></div><p className="mt-2 text-sm leading-6 text-cocoa/70">进食：{item.appetite} · 精神：{item.energy} · 便便：{item.stool}{item.weight ? ` · ${item.weight} kg` : ""}</p>{item.note ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{item.note}</p> : null}</article>) : <p className="py-6 text-sm text-cocoa/60">从今天开始记录，一周后再回头看看。</p>}</section>
    <button className="mt-6 inline-flex items-center gap-2 text-sm text-cocoa/60" onClick={() => { if (!confirm("清空当前档案在本机的全部观察与对话？此操作不能撤销，请先导出备份。")) return; try { persist({ version: 1, records: [], conversation: [] }); setRecord({ ...record, actionDone: false, note: "", weight: "", appetite: "没有观察", energy: "没有观察", stool: "没有观察" }); setMessage("本机观察与对话已清空。"); } catch { setMessage("清空失败，请检查浏览器存储权限。"); } }}><Trash2 size={16}/>清空这份本机档案记录</button>
  </main>;
}
