"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import BrowserIcon from "@/assets/browser-icon.svg"
import Background from "@/assets/submit-url-background.svg"
import { useJwtStore } from "@/store/jwt"
import { useReceiptsStore } from "@/store/receipts"
import { Tag } from "@/types"
import { Ban, Info, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import RequireAuth from "@/components/helper/RequireAuth"
import Select from "@/app/(stateless-toolbar)/submit-url/components/TagSelect"

import { SubmitSiteFrame } from "./components/SubmitSiteFrame"
import Slider from "./components/slider"

const SubmitUrl = () => {
  const { updateList } = useReceiptsStore()
  const { token } = useJwtStore()
  const [creatingTag, setCreatingTag] = useState<boolean>(false)
  const [description, setDescription] = useState<string>("")
  const [errorSending, setErrorSending] = useState<Error | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [previewPasses, setPreviewPasses] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Array<Tag>>([])
  const [showTags, setShowTags] = useState<Array<Tag>>([])
  const [showTagInput, setShowTagInput] = useState(false)
  const [sent, setSent] = useState(false)
  const [url, setUrl] = useState<string>("")

  const addSelected = (option: string) => {
    const tag = showTags.find((tag) => tag.name === option)
    setSelectedTags((prev) => [...prev, tag!])
  }

  const createTag = async () => {
    setCreatingTag(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tag`, {
        body: JSON.stringify({ name: newTag }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const { tag } = await res.json()
      setShowTags((prev) => [...prev, tag])
      hideNewTag()
    } catch (err) {
      console.log("Error: ", err)
    }
  }

  const hideNewTag = () => {
    setNewTag("")
    setShowTagInput(false)
  }

  const getTags = async () => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/tag"
      ).then((res) => res.json())
      if ("tags" in response) {
        setShowTags(response.tags)
      }
    } catch (error) {
      console.log(error)
      setShowTags([])
    }
  }

  const onClickShareItHandler = async () => {
    setIsSending(true)
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tags: selectedTags.map((tag) => tag._id),
        title: description,
        url: url,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw Error
        }
        setSent(true)
        setTimeout(() => {
          setDescription("")
          setPreviewPasses(false)
          setUrl("")
          setSelectedTags([])
          setSent(false)
        }, 3000)
        return res.json()
      })
      .catch((err) => {
        setErrorSending(err)
        setTimeout(() => {
          setErrorSending(null)
        }, 3000)
      })
      .finally(() => {
        setIsSending(false)
      })
    updateList({
      object: response.newUrl,
      receipt: response.receipt,
      type: "Url",
    })
  }

  const optionNames = useMemo(() => {
    return showTags.map((tag) => tag.name)
  }, [showTags])

  const removeSelected = (index: number) => {
    setSelectedTags((prev) => prev.filter((_, i) => i !== index))
  }

  const selectedNames = useMemo(() => {
    return selectedTags.map((tag) => tag.name)
  }, [selectedTags])

  useEffect(() => {
    getTags()
  }, [])

  return (
    <div
      className="flex h-full items-start md:items-center justify-center bg-shark-900 bg-center bg-no-repeat p-2"
      style={{
        backgroundImage: `url(${Background.src})`,
        backgroundSize: "90%",
      }}
    >
      <div className="w-full max-w-[1130px] rounded-[32px] bg-c4-gradient-separator p-px">
        <div className="relative h-full md:h-[501px] rounded-[32px] bg-shark-950 p-10 pb-16 overflow-y-auto">
          <div className="flex h-full items-start justify-between gap-10 flex-col md:flex-row">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-6 text-5xl">
                <div>Add a website</div>
                <Image alt="Browser" className="h-10 w-10" src={BrowserIcon} />
              </div>
              <div className="mt-10 text-xl text-shark-50">Website URL</div>
              <input
                className="mt-4 w-full rounded-lg border-[1.5px] border-shark-800 bg-shark-950 p-3 text-lg placeholder:text-shark-400"
                placeholder="Paste URL here"
                onChange={(e) => setUrl(e.target.value)}
                value={url ?? ""}
              />
              <div className="mt-6 flex items-center gap-2">
                <div className="text-xl text-shark-50">Short description</div>
                <div className="text-sm text-shark-300">(Optional)</div>
              </div>
              <input
                className="mt-4 w-full rounded-lg border-[1.5px] border-shark-800 bg-shark-950 p-3 text-lg placeholder:text-shark-400"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="This site is about..."
                value={description}
              />
              <div className="mt-6 flex items-center justify-between">
                <div className="text-xl text-shark-50">Choose tags</div>
                {showTagInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      className="rounded-lg border-[1.5px] border-shark-800 bg-shark-950 px-2 placeholder:text-shark-400"
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Tag name..."
                      value={newTag}
                    />
                    <div className="flex items-center">
                      {!creatingTag && (
                        <Button
                          className="h-fit p-2"
                          onClick={() => hideNewTag()}
                          variant="ghost"
                        >
                          <Ban size={16} />
                        </Button>
                      )}
                      <Button
                        className="h-fit p-2"
                        loading={creatingTag}
                        loaderIconSize={14}
                        loadingText="Creating tag"
                        onClick={() => !creatingTag && createTag()}
                        variant="ghost"
                      >
                        {creatingTag ? "Creating tag..." : "Create"}
                        {!creatingTag && <Plus size={16} />}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="h-fit p-2"
                    onClick={() => setShowTagInput(true)}
                    variant="ghost"
                  >
                    <div>Create tag</div>
                    <Plus size={14} />
                  </Button>
                )}
              </div>
              <Select
                onSelect={addSelected}
                onRemove={removeSelected}
                options={optionNames}
                selected={selectedNames}
              />
            </div>
            <div className="flex h-full flex-1 flex-col w-full">
              <div className="text-xl text-shark-50">Preview</div>
              <SubmitSiteFrame url={url} />
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    className="h-[18px] w-[18px] cursor-pointer rounded border border-shark-500 bg-shark-700 shrink-0"
                    checked={previewPasses}
                    onChange={() => setPreviewPasses(!previewPasses)}
                    type="checkbox"
                  />
                  <div className="text-sm text-shark-200">
                    Check this box if the website preview looks good
                  </div>
                </div>
                <Popover>
                  <PopoverTrigger className="relative flex cursor-pointer items-center gap-2 text-sm disabled:cursor-not-allowed">
                    <Info
                      className="cursor-pointer stroke-shark-300"
                      size={16}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    alignOffset={-15}
                    className="w-64 rounded-lg border border-shark-800 bg-shark-950 p-4 text-left text-sm text-shark-50"
                    side="top"
                    sideOffset={15}
                  >
                    Some websites don&apos;t allow other applications to render
                    their website in an iframe. Make sure you the preview
                    renders correctly so others can enjoy this channel.
                  </PopoverContent>
                </Popover>
              </div>
              <div className="mt-8">
                <Slider
                  disabled={!previewPasses || !url}
                  error={errorSending}
                  onSubmit={onClickShareItHandler}
                  sending={isSending}
                  sent={sent}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubmitUrl
