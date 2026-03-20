import { useState, useRef } from 'react'
import { useTema } from '../context/TemaContext'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dpwlzl4lv'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'pos_pro_gt'

export default function SubirFoto({ fotoActual, onFotoSubida, label = 'Foto', size = 'md' }) {
  const { modoOscuro } = useTema()
  const [subiendo, setSubiendo] = useState(false)
  const [preview, setPreview] = useState(fotoActual || null)
  const fileRef = useRef()

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }

  const subirFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target.result)
    reader.readAsDataURL(file)

    setSubiendo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', UPLOAD_PRESET)
      formData.append('folder', 'pos_pro_gt')

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.secure_url) {
        setPreview(data.secure_url)
        onFotoSubida(data.secure_url)
      } else {
        alert('Error al subir la foto')
      }
    } catch (e) {
      console.log('Error:', e)
      alert('Error al subir la foto')
    }
    setSubiendo(false)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => !subiendo && fileRef.current?.click()}
        className={`${sizes[size]} rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed transition-all relative ${
          modoOscuro
            ? 'border-gray-600 bg-gray-700 hover:border-blue-500'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400'
        }`}
      >
        {preview ? (
          <img src={preview} alt="foto" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <span className="text-2xl">📷</span>
            {size !== 'sm' && <span className={`text-xs mt-1 ${modoOscuro ? 'text-gray-400' : 'text-gray-400'}`}>{label}</span>}
          </div>
        )}
        {subiendo && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-xs font-bold">⏳</div>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={subirFoto} className="hidden" />
      {preview && (
        <button
          onClick={() => { setPreview(null); onFotoSubida('') }}
          className="text-xs text-red-500 hover:text-red-700 font-bold"
        >
          🗑️ Quitar foto
        </button>
      )}
    </div>
  )
}