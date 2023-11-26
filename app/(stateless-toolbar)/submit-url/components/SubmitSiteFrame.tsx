"use client"

import { useState } from "react"
import Image from "next/image"
import BadURLDisplay from "@/assets/bad-url-display.png"

import { useDebounce } from "@/app/hooks/useDebounce"

interface SubmitSiteFrame {
  url: string
}

export function SubmitSiteFrame({ url }: SubmitSiteFrame): JSX.Element {
  const [error, setError] = useState<Error | null>(null)
  const iframeUrl = useDebounce(url, 500)

  return (
    <div className="rounded-2xl border border-shark-600 grow mt-2 rounded-2xl h-full">
      {error ? (
        <div className="bg-shark-200 h-full rounded-2xl flex items-center justify-center">
          <div className="px-4 text-shark-800">
            Can't connect. Please try a different URL
          </div>
        </div>
      ) : iframeUrl ? (
        <iframe className="h-full w-full rounded-2xl" src={iframeUrl} />
      ) : (
        <Image
          alt="No URL"
          className="rounded-2xl h-full"
          src={BadURLDisplay}
        />
      )}
    </div>
  )
}
