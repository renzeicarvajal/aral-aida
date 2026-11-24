import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


const TAGALOG_MARKERS = /\b(ang|ng|mga|sa|ay|na|ni|kay|ako|ikaw|siya|kami|tayo|nila|ito|iyan|doon|dito|hindi|oo|po|ba|kasi|pero|at|habang|dahil|para|kung|ano|sino|saan|kailan|bakit|paano|isang|araw|gabi|bahay|paaralan|guro|mag-aaral|kaibigan|nanay|tatay|masaya|malungkot)\b/i

function looksFilipino(text: string): boolean {
  const words = text.split(/\s+/).length
  const hits = text.match(new RegExp(TAGALOG_MARKERS.source, 'gi')) || []
  
  return hits.length >= 4 && hits.length / words > 0.03
}

async function callLLM(prompt: string): Promise<string> {
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai&nocache=${Date.now()}${Math.random()}`
  const response = await fetch(url, { method: 'GET', headers: { Accept: 'text/plain' } })
  if (!response.ok) throw new Error('AI generation failed')
  return await response.text()
}

export async function POST(request: NextRequest) {
  try {
    const { learnerId } = await request.json()

    const learner = await prisma.learner.findUnique({ where: { id: learnerId } })
    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const topics = [
      'a rainy afternoon at home',
      'a field trip to the zoo',
      'helping parents cook dinner',
      'playing basketball with friends',
      'a visit to the local library',
      'planting a vegetable garden',
      'a school science fair',
      'a day at the beach',
      'joining a school club',
      'a brownout in the barangay'
    ]
    const characters = ['Maria', 'Juan', 'Ana', 'Pedro', 'Luisa', 'Carlos', 'Rosa', 'Miguel']
    const randomTopic = topics[Math.floor(Math.random() * topics.length)]
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)]

    const buildPrompt = (strict: boolean) => `You are an expert reading-assessment writer for Philippine junior high school students.

LANGUAGE RULE (MANDATORY): Write 100% in ENGLISH ONLY. Every sentence of the passage, every question, and every answer must be in English. Do NOT use Filipino, Tagalog, Taglish, or any Filipino words. Filipino personal names and place names are allowed, but nothing else.${strict ? ' Your previous attempt incorrectly used Filipino words. Correct this. Output English only.' : ''}

TASK:
1. Write a reading passage of 150-200 words for a Grade ${learner.grade} student whose Phil-IRI reading level is "${learner.philIriLevel}".
   Topic: ${randomTopic}
   Main character: ${randomCharacter}
   Setting: a Philippine community (names may be Filipino, language must be English)
   Adjust sentence length and vocabulary to the reading level: short and simple for Frustration, moderate for Instructional, richer for Independent.

2. Write exactly 10 comprehension questions in English about the passage:
   - Items 1-5: Literal (answer stated directly in the text)
   - Items 6-8: Inferential (requires reasoning from clues in the text)
   - Items 9-10: Critical/Applied (evaluation, opinion, or real-life application)
   Each answer must be short (one sentence or phrase) and must be defensible from the passage.

Output ONLY valid JSON. No markdown, no code fences, no commentary. Use exactly this shape:
{
  "passage": "full English passage here",
  "questions": [
    {"number": 1, "type": "Literal", "question": "...", "answer": "..."},
    {"number": 2, "type": "Literal", "question": "...", "answer": "..."},
    {"number": 3, "type": "Literal", "question": "...", "answer": "..."},
    {"number": 4, "type": "Literal", "question": "...", "answer": "..."},
    {"number": 5, "type": "Literal", "question": "...", "answer": "..."},
    {"number": 6, "type": "Inferential", "question": "...", "answer": "..."},
    {"number": 7, "type": "Inferential", "question": "...", "answer": "..."},
    {"number": 8, "type": "Inferential", "question": "...", "answer": "..."},
    {"number": 9, "type": "Critical", "question": "...", "answer": "..."},
    {"number": 10, "type": "Critical", "question": "...", "answer": "..."}
  ]
}`

    
    let rawText = await callLLM(buildPrompt(false))

    let parsed: { passage: string; questions: any[] } | null = null
    const tryParse = (text: string) => {
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) return null
      try {
        const obj = JSON.parse(match[0])
        if (obj?.passage && Array.isArray(obj?.questions)) return obj
      } catch {}
      return null
    }

    parsed = tryParse(rawText)

    
    const combinedText = parsed
      ? parsed.passage + ' ' + parsed.questions.map((q: any) => `${q.question} ${q.answer}`).join(' ')
      : rawText

    if (!parsed || looksFilipino(combinedText)) {
      console.log('Retrying generation (parse failure or non-English output detected)')
      rawText = await callLLM(buildPrompt(true))
      parsed = tryParse(rawText)
    }

    if (!parsed) {
      return NextResponse.json(
        { error: 'The AI returned an unreadable response. Please try generating again.' },
        { status: 502 }
      )
    }

    
    const finalText = parsed.passage + ' ' + parsed.questions.map((q: any) => `${q.question} ${q.answer}`).join(' ')
    if (looksFilipino(finalText)) {
      return NextResponse.json(
        { error: 'The AI produced a non-English passage twice. Please click Generate again.' },
        { status: 502 }
      )
    }

    const newMaterial = await prisma.material.create({
      data: {
        content: parsed.passage,
        questions: JSON.stringify(parsed.questions),
        learnerId: learner.id,
      }
    })

    return NextResponse.json({ success: true, material: newMaterial })

  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json({ error: 'Failed to generate material' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get('learnerId')
  if (!learnerId) return NextResponse.json({ error: 'Missing learnerId' }, { status: 400 })

  const materials = await prisma.material.findMany({
    where: { learnerId: parseInt(learnerId) },
    orderBy: { generatedAt: 'desc' }
  })
  return NextResponse.json(materials)
}

export async function DELETE(request: NextRequest) {
  try {
    const materialId = request.nextUrl.searchParams.get('id')
    if (!materialId) return NextResponse.json({ error: 'Missing material id' }, { status: 400 })

    await prisma.material.delete({ where: { id: parseInt(materialId) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
  }
}