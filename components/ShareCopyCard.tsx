"use client";

import { BookOpen, Check, Copy, Download, Image as ImageIcon, MessageCircle, Radio, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { AssessmentInput, GeneratedResult } from "@/lib/types";

type Props = {
  allowShare: boolean;
  shareCopy: string;
  result: GeneratedResult;
  assessment: AssessmentInput | null;
};

const DEFAULT_DOG_PHOTO = "/images/default-dog-avatar.png";
const PUBLIC_SHARE_URL = "https://dog-health-check.vercel.app/";
type SharePlatform = "wechat" | "xiaohongshu" | "weibo";

const platformNames: Record<SharePlatform, string> = {
  wechat: "朋友圈",
  xiaohongshu: "小红书",
  weibo: "微博"
};

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function wrappedText(context: CanvasRenderingContext2D, text: string, x: number, y: number, width: number, lineHeight: number, maxLines: number) {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    if (context.measureText(line + char).width > width && line) {
      lines.push(line);
      line = char;
      if (lines.length === maxLines) break;
    } else line += char;
  }
  if (line && lines.length < maxLines) lines.push(line);
  const used = lines.join("").length;
  lines.forEach((value, index) => context.fillText(index === maxLines - 1 && used < text.length ? `${value}…` : value, x, y + index * lineHeight));
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("photo-load-failed"));
    if (/^https?:/i.test(source)) image.crossOrigin = "anonymous";
    image.src = source;
  });
}

function formatDogAge(age?: string) {
  const value = age?.trim();
  if (!value) return "年龄保密";
  if (/^\d+(\.\d+)?$/.test(value)) return `${value}岁`;
  return value;
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, size: number) {
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.save();
  context.beginPath();
  context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(image, x + (size - width) / 2, y + (size - height) / 2, width, height);
  context.restore();
}

async function createShareImageFile(result: GeneratedResult, assessment: AssessmentInput | null) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法生成图片。");

  const gradient = context.createLinearGradient(0, 0, 1080, 1440);
  gradient.addColorStop(0, "#fff7fb"); gradient.addColorStop(0.48, "#ffe4ef"); gradient.addColorStop(1, "#fff0c9");
  context.fillStyle = gradient; context.fillRect(0, 0, 1080, 1440);
  context.fillStyle = "rgba(255,120,167,.13)";
  for (const [x, y] of [[80,110],[970,160],[80,1280],[940,1200],[530,70]]) { context.beginPath(); context.arc(x, y, 34, 0, Math.PI * 2); context.fill(); }

  context.fillStyle = "rgba(255,255,255,.93)"; roundRect(context, 60, 60, 960, 1320, 54); context.fill();
  context.strokeStyle = "#ffc8dc"; context.lineWidth = 4; context.stroke();

  context.fillStyle = "#ff78a7"; context.font = "800 32px system-ui, sans-serif"; context.fillText("✦ 毛孩子幸福小档案", 120, 145);
  context.fillStyle = "#56313d"; context.font = "900 58px system-ui, sans-serif";
  context.fillText(`${assessment?.dogName?.trim() || "我家狗狗"}的今日幸福卡`, 120, 230);

  let photoDrawn = false;
  try {
    const image = await loadImage(assessment?.dogPhoto || DEFAULT_DOG_PHOTO);
    context.fillStyle = "#fff3cf"; context.beginPath(); context.arc(254, 405, 130, 0, Math.PI * 2); context.fill();
    drawCover(context, image, 144, 295, 220);
    photoDrawn = true;
  } catch { /* Render the safe fallback below. */ }
  if (!photoDrawn) {
    context.fillStyle = "#fff0f6"; context.beginPath(); context.arc(254, 405, 110, 0, Math.PI * 2); context.fill();
    context.font = "100px system-ui, sans-serif"; context.textAlign = "center"; context.fillText("🐶", 254, 445); context.textAlign = "start";
  }

  context.fillStyle = "#fff3cf"; roundRect(context, 430, 295, 510, 220, 34); context.fill();
  context.fillStyle = "#744552"; context.font = "800 28px system-ui, sans-serif"; context.fillText("幸福指数", 480, 360);
  const scoreText = String(result.happinessScore);
  context.fillStyle = "#ff78a7"; context.font = "900 104px system-ui, sans-serif"; context.fillText(scoreText, 480, 455);
  const scoreWidth = context.measureText(scoreText).width;
  context.fillStyle = "#744552"; context.font = "800 28px system-ui, sans-serif"; context.fillText("/ 100", 480 + scoreWidth + 18, 442);
  context.fillStyle = "#744552"; context.font = "700 25px system-ui, sans-serif"; wrappedText(context, result.statusText, 480, 492, 400, 30, 1);

  context.fillStyle = "#fff0f6"; roundRect(context, 120, 570, 840, 180, 34); context.fill();
  context.fillStyle = "#ff78a7"; context.font = "800 27px system-ui, sans-serif"; context.fillText("今天最值得关注", 160, 630);
  context.fillStyle = "#56313d"; context.font = "900 43px system-ui, sans-serif"; wrappedText(context, result.coreRisk.title, 160, 700, 750, 50, 2);

  context.fillStyle = "#56313d"; context.font = "900 34px system-ui, sans-serif"; context.fillText("身心双指标", 120, 825);
  let y = 885;
  ([{ label: "健康习惯", score: result.healthScore }, { label: "精神福祉", score: result.mentalWellbeingScore }]).forEach(({ label, score }) => {
    context.fillStyle = "#744552"; context.font = "700 25px system-ui, sans-serif"; context.fillText(label, 120, y);
    context.fillStyle = "#f7e6ed"; roundRect(context, 310, y - 24, 520, 18, 9); context.fill();
    const bar = context.createLinearGradient(310, 0, 830, 0); bar.addColorStop(0, "#ff78a7"); bar.addColorStop(1, "#f7b735");
    context.fillStyle = bar; roundRect(context, 310, y - 24, Math.max(18, 520 * score / 100), 18, 9); context.fill();
    context.fillStyle = "#744552"; context.fillText(String(score), 865, y); y += 88;
  });

  context.fillStyle = "#fff8e8"; roundRect(context, 120, 1100, 840, 156, 30); context.fill();
  context.fillStyle = "#56313d"; context.font = "800 28px system-ui, sans-serif"; context.fillText("今天先做这一件事", 155, 1144);
  context.fillStyle = "#744552"; context.font = "500 22px system-ui, sans-serif"; wrappedText(context, result.todayAction.body, 155, 1184, 785, 30, 2);
  context.fillStyle = "#9a7180"; context.font = "600 21px system-ui, sans-serif"; context.fillText("我助力你更好了解毛孩子，但无法替代兽医或行为专业评估", 120, 1335);

  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("分享图生成失败。")), "image/png"));
  return new File([blob], `${assessment?.dogName?.trim() || "狗狗"}-幸福小档案.png`, { type: "image/png" });
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a"); link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ShareCopyCard({ allowShare, shareCopy, result, assessment }: Props) {
  const [copied, setCopied] = useState(false);
  const [busyPlatform, setBusyPlatform] = useState<SharePlatform | "download" | null>(null);
  const [status, setStatus] = useState("");

  async function copyText() {
    try { await navigator.clipboard.writeText(shareCopy); }
    catch {
      const textarea = document.createElement("textarea"); textarea.value = shareCopy; textarea.style.position = "fixed"; textarea.style.opacity = "0";
      document.body.appendChild(textarea); textarea.select(); document.execCommand("copy"); textarea.remove();
    }
  }
  async function handleCopy() { await copyText(); setCopied(true); setTimeout(() => setCopied(false), 1600); }
  async function downloadImage() {
    setBusyPlatform("download"); setStatus("");
    try {
      const file = await createShareImageFile(result, assessment);
      downloadFile(file);
      setStatus("分享图已保存到下载目录。");
    } catch {
      setStatus("图片生成失败了，请换个浏览器或重新上传照片后再试。");
    } finally {
      setBusyPlatform(null);
    }
  }

  async function shareToPlatform(platform: SharePlatform) {
    const platformName = platformNames[platform];
    const probeFile = new File(["share"], "share.png", { type: "image/png" });
    const supportsNativeFileShare = Boolean(
      "share" in navigator && (!("canShare" in navigator) || navigator.canShare({ files: [probeFile] }))
    );
    const weiboWindow = platform === "weibo" && !supportsNativeFileShare
      ? window.open("", "_blank")
      : null;
    setBusyPlatform(platform); setStatus("");
    try {
      const file = await createShareImageFile(result, assessment);

      if (supportsNativeFileShare) {
        try {
          await navigator.share({ title: "毛孩子幸福小档案", text: shareCopy, files: [file] });
          setStatus(`已完成${platformName}系统分享。`);
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setStatus("已取消分享。");
            return;
          }
        }
      }

      await copyText();
      downloadFile(file);
      if (platform === "weibo") {
        const query = new URLSearchParams({ url: PUBLIC_SHARE_URL, title: shareCopy });
        const weiboUrl = `https://service.weibo.com/share/share.php?${query.toString()}`;
        if (weiboWindow) weiboWindow.location.href = weiboUrl;
        else window.open(weiboUrl, "_blank", "noopener,noreferrer");
        setStatus("分享图已保存、文案已复制，并已打开微博发布页。");
      } else {
        setStatus(`分享图已保存、文案已复制，请在${platformName}发布页选择图片。`);
      }
    } catch {
      weiboWindow?.close();
      setStatus("分享准备失败了，请换个浏览器或重新上传照片后再试。");
    } finally {
      setBusyPlatform(null);
    }
  }

  return (
    <section className="candy-card overflow-hidden rounded-[2.2rem] p-5 sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[.86fr_1.14fr] lg:items-center">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[330px] overflow-hidden rounded-[2rem] border-4 border-white bg-gradient-to-br from-roseSoft via-white to-goldSoft p-5 shadow-candy">
          <span className="absolute right-4 top-3 text-3xl">✨</span>
          <p className="text-xs font-black text-rose">毛孩子幸福小档案</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] border-4 border-white bg-roseSoft shadow-panel">
              <img
                src={assessment?.dogPhoto || DEFAULT_DOG_PHOTO}
                alt={assessment?.dogPhoto ? "狗狗头像" : "白色雪纳瑞默认头像"}
                className="h-full w-full object-cover"
              />
            </div>
            <div><p className="font-black text-ink">{assessment?.dogName?.trim() || "我家狗狗"}</p><p className="mt-1 text-sm font-bold text-cocoa/65">{assessment?.breed || "可爱小狗"} · {formatDogAge(assessment?.age)}</p></div>
          </div>
          <div className="mt-5 rounded-3xl bg-white/85 p-4"><p className="text-xs font-black text-cocoa/60">幸福指数</p><p className="mt-1 text-5xl font-black text-rose">{result.happinessScore}<span className="ml-1 text-base text-cocoa/50">/ 100</span></p><p className="mt-2 text-xs font-bold text-cocoa/60">健康 {result.healthScore} · 精神 {result.mentalWellbeingScore}</p></div>
          <div className="mt-4 rounded-3xl bg-goldSoft/80 p-4"><p className="text-xs font-black text-gold">今日关注</p><p className="mt-1 font-black text-ink">{result.coreRisk.title}</p></div>
          <p className="absolute bottom-4 pr-4 text-xs font-bold leading-5 text-cocoa/45">我助力你更好了解毛孩子，但无法替代兽医或行为专业评估</p>
        </div>

        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-goldSoft px-4 py-2 text-sm font-black text-gold"><Sparkles size={17} /> 分享这张可爱幸福卡</p>
          <h2 className="mt-4 text-3xl font-black text-ink">保存图片，记录毛孩子的今日状态</h2>
          <p className="mt-3 leading-7 text-cocoa/70">{allowShare ? "照片、昵称和测评结果会一起生成竖版图片。照片读取失败时会自动换成小狗头像，不影响保存。" : "检测到需要优先确认的健康或行为信号，这次不建议分享，请先获得专业支持。"}</p>
          {allowShare ? <div className="mt-4 max-h-44 overflow-auto whitespace-pre-wrap rounded-3xl bg-white/75 p-4 text-sm leading-6 text-cocoa/75">{shareCopy}</div> : <div className="mt-4 rounded-3xl bg-red-50 p-4 text-sm leading-6 text-red-800">先处理健康确认，分享按钮已暂时关闭。</div>}
          <div className="mt-5 flex flex-wrap gap-3">
            {allowShare ? <>
              <button disabled={busyPlatform !== null} onClick={() => shareToPlatform("wechat")} className="inline-flex items-center gap-2 rounded-full bg-[#1aad19] px-5 py-3 text-sm font-black text-white shadow-panel disabled:opacity-60"><MessageCircle size={18} />{busyPlatform === "wechat" ? "准备中…" : "朋友圈"}</button>
              <button disabled={busyPlatform !== null} onClick={() => shareToPlatform("xiaohongshu")} className="inline-flex items-center gap-2 rounded-full bg-[#ff2442] px-5 py-3 text-sm font-black text-white shadow-panel disabled:opacity-60"><BookOpen size={18} />{busyPlatform === "xiaohongshu" ? "准备中…" : "小红书"}</button>
              <button disabled={busyPlatform !== null} onClick={() => shareToPlatform("weibo")} className="inline-flex items-center gap-2 rounded-full bg-[#ff8200] px-5 py-3 text-sm font-black text-white shadow-panel disabled:opacity-60"><Radio size={18} />{busyPlatform === "weibo" ? "准备中…" : "微博"}</button>
              <button disabled={busyPlatform !== null} onClick={downloadImage} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-rose shadow-panel ring-1 ring-rose/20 disabled:opacity-60"><Download size={18} />{busyPlatform === "download" ? "生成中…" : "保存分享图"}</button>
              <button onClick={handleCopy} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-cocoa shadow-panel ring-1 ring-rose/10">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "已复制" : "复制文案"}</button>
            </> : null}
            <Link href="/assessment" className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black text-cocoa/70"><RotateCcw size={18} />重新测一次</Link>
          </div>
          {status ? <p role="status" className="mt-4 rounded-2xl bg-goldSoft px-4 py-3 text-sm font-bold leading-6 text-cocoa">{status}</p> : null}
          <p className="mt-4 flex items-center gap-2 text-xs text-cocoa/45"><ImageIcon size={15} />图片仅在你的设备上生成，不会上传服务器。</p>
        </div>
      </div>
    </section>
  );
}
