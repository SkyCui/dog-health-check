import AssessmentForm from "@/components/AssessmentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AssessmentPage() {
  return <main className="page-wrap assessment-page">
    <div className="assessment-page-top"><Link href="/" className="inline-flex items-center gap-2 text-sm text-cocoa"><ArrowLeft size={16}/>返回首页</Link><span>免费幸福自查 · 10 个题组</span></div>
    <h1 className="sr-only">幸福自查</h1>
    <AssessmentForm/>
  </main>;
}
