import TranslationExercises from '@/components/TranslationExercises'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Vertaaloefeningen
          </h1>
          
          <p className="text-xl text-blue-700 font-medium mb-6">
            Interactieve vertaaloefeningen powered by Gemini AI
          </p>
        </div>

        {/* Main Content */}
        <TranslationExercises />
      </div>
    </div>
  )
}