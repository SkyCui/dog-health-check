"use client";

import { BookOpen, Check, Copy, MessageCircle, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DimensionKey, GeneratedResult } from "@/lib/types";

type ShareCopyCardProps = {
  allowShare: boolean;
  shareCopy: string;
  result: GeneratedResult;
};

const dimensionLabels: Record<DimensionKey, string> = {
  body: "体况",
  diet: "饮食",
  movement: "运动嗅闻",
  recent: "近期状态",
  environment: "家庭环境"
};

function drawRoundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 4
) {
  const lines: string[] = [];
  let line = "";

  for (const char of text) {
    const testLine = line + char;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
      if (lines.length === maxLines) break;
    } else {
      line = testLine;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  lines.forEach((currentLine, index) => {
    const suffix = index === maxLines - 1 && text.length > lines.join("").length ? "..." : "";
    context.fillText(`${currentLine}${suffix}`, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
}

async function createShareImageFile(result: GeneratedResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available.");
  }

  context.fillStyle = "#f7faf6";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#dff4e8";
  drawRoundRect(context, 64, 64, 952, 1312, 42);
  context.fill();

  context.fillStyle = "#ffffff";
  drawRoundRect(context, 104, 104, 872, 1232, 34);
  context.fill();

  context.fillStyle = "#2f7d5c";
  context.font = "700 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("狗狗 1 分钟健康自测", 152, 186);

  context.fillStyle = "#1f2933";
  context.font = "800 66px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("长寿习惯指数", 152, 282);

  context.fillStyle = "#2f7d5c";
  context.font = "800 108px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText(String(result.longevityScore), 152, 420);

  context.fillStyle = "#667085";
  context.font = "600 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("/ 100", 330, 412);

  context.fillStyle = "#fff2cf";
  drawRoundRect(context, 152, 474, 776, 88, 22);
  context.fill();

  context.fillStyle = "#1f2933";
  context.font = "700 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  drawWrappedText(context, `当前状态：${result.statusText}`, 184, 530, 712, 42, 1);

  context.fillStyle = "#f3f6f3";
  drawRoundRect(context, 152, 616, 776, 150, 24);
  context.fill();

  context.fillStyle = "#2f7d5c";
  context.font = "700 30px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("最值得关注", 184, 678);

  context.fillStyle = "#1f2933";
  context.font = "800 42px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  drawWrappedText(context, result.coreRisk.title, 184, 734, 712, 50, 1);

  context.fillStyle = "#1f2933";
  context.font = "800 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("今天先做这一件事", 152, 824);

  context.fillStyle = "#475467";
  context.font = "500 28px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  drawWrappedText(context, result.todayAction.body, 152, 880, 776, 40, 3);

  context.fillStyle = "#1f2933";
  context.font = "800 34px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("五维小指标", 152, 1052);

  const barStartY = 1112;
  const rowHeight = 44;
  (Object.keys(dimensionLabels) as DimensionKey[]).forEach((key, index) => {
    const y = barStartY + index * rowHeight;
    const score = result.dimensionScores[key];

    context.fillStyle = "#344054";
    context.font = "600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText(dimensionLabels[key], 152, y);

    context.fillStyle = "#e7ece7";
    drawRoundRect(context, 330, y - 22, 456, 18, 9);
    context.fill();

    context.fillStyle = score >= 85 ? "#2f7d5c" : score >= 70 ? "#d6a026" : "#d96b5f";
    drawRoundRect(context, 330, y - 22, Math.max(18, 456 * (score / 100)), 18, 9);
    context.fill();

    context.fillStyle = "#667085";
    context.font = "600 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    context.fillText(String(score), 820, y);
  });

  context.fillStyle = "#667085";
  context.font = "500 24px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
  context.fillText("@百万是人类的好朋友", 650, 1320);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((imageBlob) => {
      if (imageBlob) {
        resolve(imageBlob);
      } else {
        reject(new Error("Failed to create share image."));
      }
    }, "image/png");
  });

  return new File([blob], "dog-health-check-share.png", { type: "image/png" });
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ShareCopyCard({ allowShare, shareCopy, result }: ShareCopyCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState("");

  async function copyShareText() {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareCopy);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = shareCopy;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function handleCopy() {
    await copyShareText();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function shareWithNativePanel(platformName: string, appScheme?: string) {
    await copyShareText();
    const imageFile = await createShareImageFile(result);

    const shareData = {
      title: "狗狗 1 分钟健康自测",
      text: shareCopy,
      url: window.location.origin,
      files: [imageFile]
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      try {
        await navigator.share(shareData);
        setShareStatus(`已打开分享面板，可以选择${platformName}发布，图片和文案都已准备好。`);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setShareStatus("已取消分享，文案仍然保留在剪贴板里。");
          return;
        }
      }
    }

    downloadFile(imageFile);

    if (appScheme) {
      window.location.href = appScheme;
      setShareStatus(`已下载分享图、复制文案，并尝试打开${platformName}。`);
      return;
    }

    setShareStatus(`已下载分享图并复制文案。当前浏览器不支持直接调起${platformName}带图分享。`);
  }

  async function shareToWeibo() {
    await copyShareText();
    const imageFile = await createShareImageFile(result);
    const nativeShareData = {
      title: "狗狗 1 分钟健康自测",
      text: shareCopy,
      url: window.location.origin,
      files: [imageFile]
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare(nativeShareData))) {
      try {
        await navigator.share(nativeShareData);
        setShareStatus("已打开系统分享面板，可以选择微博发布，图片和文案都已准备好。");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          setShareStatus("已取消分享，文案仍然保留在剪贴板里。");
          return;
        }
      }
    }

    downloadFile(imageFile);
    const title = encodeURIComponent(shareCopy);
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://service.weibo.com/share/share.php?url=${url}&title=${title}`, "_blank", "noopener,noreferrer");
    setShareStatus("已下载分享图，并打开微博分享页。微博网页版不能自动带入本地图片，请上传刚下载的 PNG。");
  }

  async function handleDownloadImage() {
    const imageFile = await createShareImageFile(result);
    downloadFile(imageFile);
    setShareStatus("已生成并下载分享图。");
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-ink">一键分享到社媒</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {allowShare
          ? "默认不包含具体体重和就医提醒细节，适合轻量分享到朋友圈、小红书或微博。"
          : "这次不建议分享，先处理健康确认更重要。"}
      </p>
      {allowShare ? (
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          {shareCopy}
        </pre>
      ) : (
        <p className="mt-4 rounded-lg bg-red-50 p-4 text-sm leading-6 text-slate-700">
          这次结果不建议生成分享内容。目前更重要的是先联系兽医，确认狗狗是否需要检查或治疗。
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        {allowShare ? (
          <>
            <button
              type="button"
              onClick={() => shareWithNativePanel("微信 / 朋友圈", "weixin://")}
              className="inline-flex items-center gap-2 rounded-lg bg-leaf px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf/90"
            >
              <MessageCircle size={18} aria-hidden="true" />
              分享到朋友圈
            </button>
            <button
              type="button"
              onClick={() => shareWithNativePanel("小红书", "xhsdiscover://")}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <BookOpen size={18} aria-hidden="true" />
              分享到小红书
            </button>
            <button
              type="button"
              onClick={shareToWeibo}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              <Send size={18} aria-hidden="true" />
              分享到微博
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
              {copied ? "已复制" : "复制文案"}
            </button>
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
            >
              <Copy size={18} aria-hidden="true" />
              保存分享图
            </button>
          </>
        ) : null}
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-slate-50"
        >
          <RotateCcw size={18} aria-hidden="true" />
          重新测一次
        </Link>
      </div>
      {shareStatus ? (
        <p className="mt-3 rounded-lg bg-amberSoft px-3 py-2 text-sm leading-6 text-slate-700">{shareStatus}</p>
      ) : null}
    </section>
  );
}
