'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

function isGifUrl(url: string) {
  return /\.gif(\?|$)/i.test(url)
}

interface Props {
  images: string[]
  alt?: string
  placeholder?: React.ReactNode
}

export default function ImageGallery({ images, alt = '', placeholder }: Props) {
  const [active, setActive] = useState(0)

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
        {placeholder ?? <span className="text-8xl">🖱️</span>}
      </div>
    )
  }

  const src = images[active]
  const isVideo = isVideoUrl(src)
  const isGif = isGifUrl(src)

  return (
    <div>
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream mb-3">
        {isVideo ? (
          <video
            key={src}
            src={src}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            controls
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            unoptimized={isGif}
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors bg-black ${
                i === active ? 'border-purple' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {isVideoUrl(img) ? (
                <>
                  <video src={img} className="w-full h-full object-cover" muted playsInline />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play size={14} fill="white" className="text-white" />
                  </span>
                </>
              ) : (
                <Image src={img} alt="" fill className="object-cover" sizes="64px" unoptimized={isGifUrl(img)} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
