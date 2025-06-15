'use client'

import { useState, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

interface Exercise {
  id: string
  type: 'translate' | 'fill-blank' | 'multiple-choice' | 'conversation'
  sourceLanguage: string
  targetLanguage: string
  text: string
  correctAnswer: string
  options?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topic: string
}

interface ExerciseResult {
  exercise: Exercise
  userAnswer: string
  isCorrect: boolean
  feedback: string
  score: number
}

export default function TranslationExercises() {
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<ExerciseResult | null>(null)
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseResult[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState({
    source: 'Nederlands',
    target: 'Engels'
  })
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [selectedTopic, setSelectedTopic] = useState('algemeen')
  const [exerciseType, setExerciseType] = useState<'translate' | 'fill-blank' | 'multiple-choice' | 'conversation'>('translate')

  const languages = [
    'Nederlands', 'Engels', 'Frans', 'Duits', 'Spaans', 'Italiaans', 'Portugees'
  ]

  const topics = [
    'algemeen', 'reizen', 'eten', 'werk', 'familie', 'hobby\'s', 'school', 'winkelen', 'gezondheid', 'weer', 'HR'
  ]

  const difficultyLabels = {
    beginner: '🟢 Beginner',
    intermediate: '🟡 Gemiddeld', 
    advanced: '🔴 Gevorderd'
  }

  const exerciseTypeLabels = {
    translate: '🔄 Vertalen',
    'fill-blank': '📝 Invullen',
    'multiple-choice': '✅ Meerkeuzevraag',
    conversation: '💬 Gesprek'
  }

  const generateExercise = async () => {
    setIsLoading(true)
    setShowResult(false)
    setUserAnswer('')
    
    try {
      const prompt = `Genereer een ${exerciseTypeLabels[exerciseType]} vertaaloefening van ${selectedLanguages.source} naar ${selectedLanguages.target}.

Specificaties:
- Niveau: ${selectedDifficulty}
- Onderwerp: ${selectedTopic}
- Type: ${exerciseType}

${exerciseType === 'translate' ? `
Geef een zin in het ${selectedLanguages.source} die vertaald moet worden naar het ${selectedLanguages.target}.
` : exerciseType === 'fill-blank' ? `
Geef een zin in het ${selectedLanguages.target} met één woord weggelaten (vervangen door ___). Geef ook de ${selectedLanguages.source} versie als context.
` : exerciseType === 'multiple-choice' ? `
Geef een zin in het ${selectedLanguages.source} en 4 mogelijke vertalingen in het ${selectedLanguages.target} (waarvan 1 correct).
` : `
Geef een korte dialoog situatie in het ${selectedLanguages.source} en vraag om een passend antwoord in het ${selectedLanguages.target}.
`}

${selectedTopic === 'HR' ? `
Focus op HR-gerelateerde onderwerpen zoals:
- Sollicitatiegesprekken
- Personeelsbeleid
- Arbeidsvoorwaarden
- Performance reviews
- Teambuilding
- Recruitment
- Onboarding
- Feedback gesprekken
- Verlof en ziekteverzuim
- Diversiteit en inclusie
` : ''}

Antwoord in dit exacte JSON formaat:
{
  "type": "${exerciseType}",
  "sourceLanguage": "${selectedLanguages.source}",
  "targetLanguage": "${selectedLanguages.target}",
  "text": "de tekst/vraag",
  "correctAnswer": "het juiste antwoord",
  ${exerciseType === 'multiple-choice' ? '"options": ["optie1", "optie2", "optie3", "optie4"],' : ''}
  "difficulty": "${selectedDifficulty}",
  "topic": "${selectedTopic}"
}`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart'
        })
      })

      if (!response.ok) {
        throw new Error('Fout bij het genereren van de oefening')
      }

      const data = await response.json()
      
      // Parse JSON from response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Geen geldige oefening ontvangen')
      }

      const exerciseData = JSON.parse(jsonMatch[0])
      const exercise: Exercise = {
        id: Date.now().toString(),
        ...exerciseData
      }

      setCurrentExercise(exercise)
    } catch (error) {
      console.error('Error generating exercise:', error)
      alert('Fout bij het genereren van de oefening. Probeer opnieuw.')
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnswer = async () => {
    if (!currentExercise || !userAnswer.trim()) return

    setIsLoading(true)
    
    try {
      const prompt = `Beoordeel dit vertaalantwoord:

Oefening: ${currentExercise.text}
Correct antwoord: ${currentExercise.correctAnswer}
Antwoord van student: ${userAnswer}

Geef feedback in dit JSON formaat:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "Uitgebreide feedback met uitleg waarom het goed/fout is en eventuele verbeterpunten"
}`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart'
        })
      })

      if (!response.ok) {
        throw new Error('Fout bij het controleren van het antwoord')
      }

      const data = await response.json()
      
      // Parse JSON from response
      const jsonMatch = data.response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Geen geldige beoordeling ontvangen')
      }

      const feedbackData = JSON.parse(jsonMatch[0])
      
      const exerciseResult: ExerciseResult = {
        exercise: currentExercise,
        userAnswer,
        isCorrect: feedbackData.isCorrect,
        feedback: feedbackData.feedback,
        score: feedbackData.score
      }

      setResult(exerciseResult)
      setExerciseHistory(prev => [exerciseResult, ...prev.slice(0, 9)]) // Keep last 10 results
      setShowResult(true)
    } catch (error) {
      console.error('Error checking answer:', error)
      alert('Fout bij het controleren van het antwoord. Probeer opnieuw.')
    } finally {
      setIsLoading(false)
    }
  }

  const nextExercise = () => {
    generateExercise()
  }

  const getAverageScore = () => {
    if (exerciseHistory.length === 0) return 0
    return Math.round(exerciseHistory.reduce((sum, result) => sum + result.score, 0) / exerciseHistory.length)
  }

  const getCorrectPercentage = () => {
    if (exerciseHistory.length === 0) return 0
    return Math.round((exerciseHistory.filter(r => r.isCorrect).length / exerciseHistory.length) * 100)
  }

  useEffect(() => {
    generateExercise()
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Settings Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Instellingen</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Van</label>
            <select
              value={selectedLanguages.source}
              onChange={(e) => setSelectedLanguages(prev => ({ ...prev, source: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Naar</label>
            <select
              value={selectedLanguages.target}
              onChange={(e) => setSelectedLanguages(prev => ({ ...prev, target: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(difficultyLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Onderwerp</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise Type */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Type oefening</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(exerciseTypeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setExerciseType(key as any)}
                className={`p-3 rounded-lg text-sm font-medium transition-all ${
                  exerciseType === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={generateExercise}
          disabled={isLoading}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '⏳ Genereren...' : '🔄 Nieuwe Oefening'}
        </button>
      </div>

      {/* Statistics */}
      {exerciseHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Statistieken</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{exerciseHistory.length}</div>
              <div className="text-sm text-gray-600">Oefeningen gedaan</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getCorrectPercentage()}%</div>
              <div className="text-sm text-gray-600">Correct beantwoord</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{getAverageScore()}</div>
              <div className="text-sm text-gray-600">Gemiddelde score</div>
            </div>
          </div>
        </div>
      )}

      {/* Current Exercise */}
      {currentExercise && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {exerciseTypeLabels[currentExercise.type]}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {difficultyLabels[currentExercise.difficulty]}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {currentExercise.topic}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-lg text-gray-800 mb-4 p-4 bg-gray-50 rounded-lg">
              {currentExercise.text}
            </div>

            {currentExercise.type === 'multiple-choice' && currentExercise.options ? (
              <div className="space-y-2">
                {currentExercise.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setUserAnswer(option)}
                    className={`w-full p-3 text-left rounded-lg border transition-all ${
                      userAnswer === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={`Typ je antwoord in het ${currentExercise.targetLanguage}...`}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                disabled={showResult}
              />
            )}
          </div>

          {!showResult ? (
            <button
              onClick={checkAnswer}
              disabled={!userAnswer.trim() || isLoading}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '⏳ Controleren...' : '✅ Controleer Antwoord'}
            </button>
          ) : (
            <button
              onClick={nextExercise}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              ➡️ Volgende Oefening
            </button>
          )}
        </div>
      )}

      {/* Result */}
      {showResult && result && (
        <div className={`rounded-xl shadow-lg p-6 ${
          result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${
              result.isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.isCorrect ? '✅ Correct!' : '❌ Niet helemaal juist'}
            </h3>
            <div className={`px-4 py-2 rounded-full text-lg font-bold ${
              result.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
            }`}>
              {result.score}/100
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Jouw antwoord: </span>
              <span className={result.isCorrect ? 'text-green-700' : 'text-red-700'}>
                {result.userAnswer}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Correct antwoord: </span>
              <span className="text-green-700 font-medium">
                {result.exercise.correctAnswer}
              </span>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">Feedback:</h4>
              <MarkdownRenderer content={result.feedback} className="text-gray-700" />
            </div>
          </div>
        </div>
      )}

      {/* Exercise History */}
      {exerciseHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recente Oefeningen</h2>
          <div className="space-y-3">
            {exerciseHistory.slice(0, 5).map((historyResult, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm text-gray-600 truncate">
                    {historyResult.exercise.text}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {exerciseTypeLabels[historyResult.exercise.type]} • {historyResult.exercise.topic}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    historyResult.isCorrect 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {historyResult.score}/100
                  </span>
                  <span className="text-lg">
                    {historyResult.isCorrect ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}