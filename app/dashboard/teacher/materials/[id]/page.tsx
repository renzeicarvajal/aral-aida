"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function ViewMaterialsPage() {
  const router = useRouter()
  const params = useParams()
  const learnerId = params.id as string

  const [learnerName, setLearnerName] = useState('')
  const [materials, setMaterials] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  useEffect(() => {
    const fetchLearner = async () => {
      const res = await fetch(`/api/learners?id=${learnerId}`)
      const data = await res.json()
      if (data) setLearnerName(data.name)
    }

    const fetchMaterials = async () => {
      const res = await fetch(`/api/generate?learnerId=${learnerId}`)
      const data = await res.json()
      setMaterials(data)
    }

    fetchLearner()
    fetchMaterials()
  }, [learnerId])

  const handleCopy = async (materialId: number, material: any) => {
    try {
      let fullText = `=== READING PASSAGE ===\n${material.content}\n\n`
      
      if (material.questions) {
        const questions = typeof material.questions === 'string' 
          ? JSON.parse(material.questions) 
          : material.questions
        
        if (questions && questions.length > 0) {
          fullText += `=== COMPREHENSION QUESTIONS ===\n`
          fullText += `(Answer each question. 1 point each. Total: 10 points)\n\n`
          questions.forEach((q: any) => {
            fullText += `${q.number}. [${q.type}] ${q.question}\n`
          })
          
          fullText += `\n=== ANSWER KEY (For Teacher's Eyes Only) ===\n`
          questions.forEach((q: any) => {
            fullText += `${q.number}. ${q.answer}\n`
          })
        }
      }

      await navigator.clipboard.writeText(fullText)
      setCopiedId(materialId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      alert('Failed to copy')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/generate?id=${deleteTarget}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteTarget(null)
        const refreshRes = await fetch(`/api/generate?learnerId=${learnerId}`)
        const refreshData = await refreshRes.json()
        setMaterials(refreshData)
      }
    } catch (err) {
      alert('Error deleting')
    }
  }

  const parseQuestions = (material: any) => {
    if (!material.questions) return []
    try {
      return typeof material.questions === 'string' 
        ? JSON.parse(material.questions) 
        : material.questions
    } catch {
      return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4 block">
          ← Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Phil-IRI Materials for {learnerName}
        </h1>
        
        {materials.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            No materials generated yet.
          </div>
        ) : (
          <div className="space-y-8">
            {materials.map((material) => {
              const questions = parseQuestions(material)
              return (
                <div key={material.id} className="bg-white p-6 rounded-lg shadow-md">
                  
                  <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <span className="text-sm text-gray-500">
                      Generated: {new Date(material.generatedAt).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(material.id, material)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                      >
                        {copiedId === material.id ? 'Copied!' : 'Copy All'}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(material.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3">
                      Reading Passage
                    </h2>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {material.content}
                    </p>
                  </div>

                  
                  {questions.length > 0 && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-purple-500 pl-3">
                          Comprehension Questions
                        </h2>
                        <p className="text-sm text-gray-500 mb-3 italic">
                          (1 point each. Total: 10 points)
                        </p>
                        <ol className="space-y-2">
                          {questions.map((q: any) => (
                            <li key={q.number} className="flex gap-2">
                              <span className="font-bold text-gray-700 min-w-[2rem]">
                                {q.number}.
                              </span>
                              <div className="flex-1">
                                <span className="text-gray-700">{q.question}</span>
                                <span className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {q.type}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>

                      
                      <details className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <summary className="font-bold text-yellow-800 cursor-pointer">
                          Answer Key (Teacher's Eyes Only)
                        </summary>
                        <ol className="mt-3 space-y-1">
                          {questions.map((q: any) => (
                            <li key={q.number} className="text-sm text-gray-700">
                              <span className="font-bold">{q.number}.</span> {q.answer}
                            </li>
                          ))}
                        </ol>
                        <div className="mt-3 pt-3 border-t border-yellow-200 text-xs text-gray-600">
                          <p><strong>Scoring Guide:</strong></p>
                          <p>• 9-10 correct = Independent Level</p>
                          <p>• 7-8 correct = Instructional Level</p>
                          <p>• 6 or below = Frustration Level</p>
                        </div>
                      </details>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this material?</h3>
            <p className="text-sm text-gray-600 mb-6">This will permanently remove the passage and all questions.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}