async function testProduction() {
  console.log('--- 1. Testing GET https://knowiq.vercel.app/api/health ---');
  const healthRes = await fetch('https://knowiq.vercel.app/api/health');
  console.log('Health Status:', healthRes.status);
  const healthData = await healthRes.json();
  console.log('Health Data:', healthData);

  console.log('\n--- 2. Testing POST https://knowiq.vercel.app/api/ai/subtopic-content ---');
  console.log('Course: AI & Machine Learning, Topic: Probability Notion');
  const startTime = Date.now();
  const res = await fetch('https://knowiq.vercel.app/api/ai/subtopic-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseName: 'AI & Machine Learning',
      topicTitle: 'Probability Notion',
      subtopicTitle: 'Probability Notion',
      existingClarity: 50
    })
  });

  const duration = Date.now() - startTime;
  console.log(`Learning status: ${res.status} (${duration}ms)`);
  const rawText = await res.text();
  console.log('Raw response text:', rawText);
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    console.error('Failed to parse response as JSON:', rawText);
    process.exit(1);
  }
  console.log('Has conceptual:', Boolean(data.conceptual));
  if (data.conceptual) {
    console.log('WhatIsIt preview:', data.conceptual.whatIsIt?.slice(0, 150) + '...');
    console.log('WhyExists preview:', data.conceptual.whyExists?.slice(0, 150) + '...');
    console.log('KeyTakeaway:', data.conceptual.keyTakeaway);
  }
  console.log('Interactive drills present:', Boolean(data.interactive));
  console.log('Hard quiz questions count:', data.hardQuiz?.length);

  if (res.ok && data.conceptual) {
    console.log('\nSUCCESS: Production learning endpoint is working and verified!');
    process.exit(0);
  } else {
    console.error('Failed response:', data);
    process.exit(1);
  }
}

testProduction().catch(err => {
  console.error('Production test execution error:', err);
  process.exit(1);
});
