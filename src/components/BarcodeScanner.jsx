import React, { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({ onDetect, onClose }) {
  const videoRef = useRef()
  const readerRef = useRef()
  const [status, setStatus] = useState('starting') // starting | scanning | fetching | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let active = true

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (!active) return

        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        reader.decodeFromVideoDevice(undefined, videoRef.current, async (result, err) => {
          if (!result || !active) return
          active = false
          reader.reset()
          setStatus('fetching')

          const code = result.getText()
          // 1) Try Open Food Facts (great for groceries)
          try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
            const data = await res.json()
            const p = data.status === 1 ? data.product : null
            if (p) {
              onDetect({
                barcode: code,
                name:  p.product_name ?? p.abbreviated_product_name ?? '',
                unit:  p.quantity ?? '',
                brand: p.brands ?? '',
              })
              return
            }
          } catch {}
          // 2) Fallback: UPC Item DB (covers household/cleaning products)
          try {
            const res2 = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`)
            const data2 = await res2.json()
            const u = data2.items?.[0]
            if (u) {
              onDetect({
                barcode: code,
                name:  u.title ?? '',
                unit:  u.size ?? '',
                brand: u.brand ?? '',
              })
              return
            }
          } catch {}
          // 3) Nothing found — return just the barcode so the user can fill manually
          onDetect({ barcode: code, name: '', unit: '', brand: '' })
        })

        if (active) setStatus('scanning')
      } catch (err) {
        if (!active) return
        setStatus('error')
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Camera access denied. Allow it in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera found on this device.')
        } else {
          setErrorMsg('Could not start camera. Use the AI Scan button instead.')
        }
      }
    }

    start()
    return () => {
      active = false
      readerRef.current?.reset()
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden w-full max-w-sm shadow-modal animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-title text-xl text-blush-400">Scan Barcode</h2>
            <p className="font-sans text-xs text-gray-400 mt-0.5">Point at a product barcode</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all"
          >✕</button>
        </div>

        {/* Camera */}
        <div className="relative bg-black" style={{ aspectRatio: '1' }}>
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-52">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-blush-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-blush-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-blush-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-blush-400 rounded-br-xl" />
                <div className="absolute inset-x-6 top-1/2 h-0.5 bg-blush-400/60 animate-pulse" />
              </div>
            </div>
          )}

          {(status === 'starting' || status === 'fetching') && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="font-sans text-sm text-white font-semibold">
                {status === 'starting' ? 'Starting camera…' : 'Looking up product…'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="text-4xl">📷</div>
              <p className="font-sans text-sm text-white">{errorMsg}</p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-white text-gray-800 font-sans font-bold text-sm"
              >Close</button>
            </div>
          )}
        </div>

        <p className="font-sans text-xs text-center text-gray-400 dark:text-gray-500 px-5 py-3">
          Name, brand &amp; unit fill in automatically
        </p>
      </div>
    </div>
  )
}
