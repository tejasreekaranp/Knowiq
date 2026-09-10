async function testEndpoints() {
  console.log('Testing live API endpoints on http://localhost:3000...');

  // 1. Analyze Topic
  const res1 = await fetch('http://localhost:3000/api/ai/analyze-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseName: 'Operating Systems',
      topicTitle: 'Process Scheduling',
      academicLevel: 'Undergraduate',
    }),
  });
  console.log('1. /api/ai/analyze-topic status:', res1.status);
  const data1 = await res1.json();
  console.log('   has_subtopics:', data1.has_subtopics, 'subtopics count:', data1.subtopics?.length);

  // 2. Conceptual Clarity
  const res2 = await fetch('http://localhost:3000/api/ai/conceptual-clarity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseName: 'Operating Systems',
      topicTitle: 'Process Scheduling',
      subtopicTitle: 'Round Robin Scheduling',
      academicLevel: 'Undergraduate',
    }),
  });
  console.log('2. /api/ai/conceptual-clarity status:', res2.status);
  const data2 = await res2.json();
  console.log('   summary length:', data2.summary?.length, 'key_concepts:', data2.key_concepts?.length);

  // 3. Interactive Question
  const res3 = await fetch('http://localhost:3000/api/ai/interactive-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseName: 'Operating Systems',
      topicTitle: 'Round Robin Scheduling',
      clarity: data2,
    }),
  });
  console.log('3. /api/ai/interactive-question status:', res3.status);
  const data3 = await res3.json();
  console.log('   question:', data3.question?.slice(0, 60), 'options:', data3.options?.length);

  // 4. Evaluate Answer
  const res4 = await fetch('http://localhost:3000/api/ai/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topicTitle: 'Round Robin Scheduling',
      question: data3,
      selectedIndex: data3.correctIndex,
      confidence: 'high',
    }),
  });
  console.log('4. /api/ai/evaluate-answer status:', res4.status);
  const data4 = await res4.json();
  console.log('   isCorrect:', data4.isCorrect, 'action:', data4.adaptiveRecommendation?.action);

  if (res1.ok && res2.ok && res3.ok && res4.ok) {
    console.log('ALL API ENDPOINTS FUNCTIONAL!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testEndpoints().catch(err => {
  console.error('Endpoint test failed:', err);
  process.exit(1);
});
