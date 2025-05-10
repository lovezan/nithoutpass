"use client"

import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface BarcodeGeneratorProps {
  value: string
}

export default function BarcodeGenerator({ value }: BarcodeGeneratorProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        lineColor: "#000",
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 16,
        margin: 10,
      })
    }
  }, [value])

  const handleDownload = () => {
    if (barcodeRef.current) {
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current)
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        const pngFile = canvas.toDataURL("image/png")
        const downloadLink = document.createElement("a")
        downloadLink.download = `barcode-${value}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }

      img.src = "data:image/svg+xml;base64," + btoa(svgData)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <svg ref={barcodeRef} className="w-full" data-testid="barcode-svg"></svg>
      <div className="flex space-x-2">
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>
    </div>
  )
}
