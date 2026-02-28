"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface DraftEditorProps {
  subjectLine: string
  emailBody: string
  onSubjectChange: (value: string) => void
  onBodyChange: (value: string) => void
  readOnly?: boolean
}

export function DraftEditor({
  subjectLine,
  emailBody,
  onSubjectChange,
  onBodyChange,
  readOnly = false,
}: DraftEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Subject Line</label>
        <Input
          value={subjectLine}
          onChange={(e) => onSubjectChange(e.target.value)}
          readOnly={readOnly}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Email Body</label>
        <Textarea
          value={emailBody}
          onChange={(e) => onBodyChange(e.target.value)}
          readOnly={readOnly}
          rows={10}
          className={readOnly ? "bg-muted" : ""}
        />
      </div>
    </div>
  )
}
