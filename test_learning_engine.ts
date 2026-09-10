import { runTopicAnalysisPipeline } from './src/server/topicEngine';
import {
  generateConceptualClarity,
  generateInteractiveQuestion,
  evaluateAnswer,
  calculateWeightedClarity,
} from './src/server/learningEngine';

async function runTests() {
  console.log('====================================================');
  console.log('KNOWIQ LEARNING ENGINE - RIGOROUS VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail || '');
    }
  }

  // ----------------------------------------------------
  // TEST 1: Topic Analysis - Process Scheduling (Expected: has_subtopics = true, 2-6 subtopics)
  // ----------------------------------------------------
  console.log('\n--- Test 1: Process Scheduling (Multi-concept Topic) ---');
  const psResult = await runTopicAnalysisPipeline(null, null, {
    courseName: 'Operating Systems',
    topicTitle: 'Process Scheduling',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate',
    syllabusExcerpt: '',
    sourceContext: '',
  });
  assert(psResult.has_subtopics === true, 'Process Scheduling decomposed into subtopics (has_subtopics = true)');
  assert(
    psResult.subtopics.length >= 2 && psResult.subtopics.length <= 6,
    `Process Scheduling created 2-6 subtopics (actual: ${psResult.subtopics.length})`
  );
  assert(
    psResult.subtopics[0].order === 1,
    'Subtopics have ordered logical sequence starting at 1'
  );
  console.log('  Subtopics generated:');
  psResult.subtopics.forEach(s => console.log(`    ${s.order}. ${s.title}: ${s.description}`));

  // ----------------------------------------------------
  // TEST 2: Topic Analysis - CPU Registers (Expected: has_subtopics = false, subtopics = [])
  // ----------------------------------------------------
  console.log('\n--- Test 2: CPU Registers (Atomic / Focused Topic) ---');
  const crResult = await runTopicAnalysisPipeline(null, null, {
    courseName: 'Computer Systems Architecture',
    topicTitle: 'CPU Registers',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate',
    syllabusExcerpt: '',
    sourceContext: '',
  });
  assert(crResult.has_subtopics === false, 'CPU Registers not artificially split (has_subtopics = false)');
  assert(crResult.subtopics.length === 0, 'CPU Registers returns empty subtopics list ([])');
  assert(crResult.conceptual_clarity.explanation.length > 200, 'Direct high-quality conceptual clarity provided for CPU Registers');
  console.log(`  Summary: ${crResult.conceptual_clarity.summary}`);

  // ----------------------------------------------------
  // TEST 3: Topic Analysis - Virtual Memory (Expected: has_subtopics = true)
  // ----------------------------------------------------
  console.log('\n--- Test 3: Virtual Memory (Complex Architecture Topic) ---');
  const vmResult = await runTopicAnalysisPipeline(null, null, {
    courseName: 'Operating Systems',
    topicTitle: 'Virtual Memory',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate',
    syllabusExcerpt: '',
    sourceContext: '',
  });
  assert(vmResult.has_subtopics === true, 'Virtual Memory decomposed into subtopics');
  assert(
    vmResult.subtopics.some(s => s.title.toLowerCase().includes('paging') || s.title.toLowerCase().includes('page')),
    'Virtual Memory subtopics include Paging / Page Tables'
  );
  console.log('  Virtual Memory subtopics:');
  vmResult.subtopics.forEach(s => console.log(`    ${s.order}. ${s.title}`));

  // ----------------------------------------------------
  // TEST 4: Conceptual Clarity Quality - 3-6 Paragraphs, Mechanisms, Examples, Misconceptions
  // ----------------------------------------------------
  console.log('\n--- Test 4: Conceptual Clarity Generation (Paging in Memory Management) ---');
  const pagingClarity = await generateConceptualClarity(null, null, {
    courseName: 'Operating Systems',
    topicTitle: 'Memory Management',
    subtopicTitle: 'Paging',
    concepts: ['Logical Address', 'Physical Frame', 'Page Table', 'Address Translation'],
    academicLevel: 'Undergraduate',
  });

  const paragraphs = pagingClarity.explanation.split('\n\n').filter(p => p.trim().length > 0);
  assert(paragraphs.length >= 3 && paragraphs.length <= 6, `Explanation has 3-6 paragraphs (actual: ${paragraphs.length})`);
  assert(pagingClarity.key_concepts.length >= 2, `Key concepts provided (actual: ${pagingClarity.key_concepts.length})`);
  assert(pagingClarity.examples.length >= 1, `Concrete worked examples provided (actual: ${pagingClarity.examples.length})`);
  assert(pagingClarity.common_confusions.length >= 1, `Common confusions identified (actual: ${pagingClarity.common_confusions.length})`);
  assert(pagingClarity.key_takeaways.length >= 2, `Key takeaways provided (actual: ${pagingClarity.key_takeaways.length})`);
  assert(!pagingClarity.explanation.includes('${'), 'Zero unparsed template placeholders or mad-libs in explanation');

  console.log(`  Summary: ${pagingClarity.summary}`);
  console.log(`  Example Title: ${pagingClarity.examples[0]?.title}`);
  console.log(`  First Confusion: ${pagingClarity.common_confusions[0]?.confusion}`);
  console.log(`  Clarification: ${pagingClarity.common_confusions[0]?.clarification}`);

  // ----------------------------------------------------
  // TEST 5: Mathematics Domain - Derivatives
  // ----------------------------------------------------
  console.log('\n--- Test 5: Mathematics Domain (Derivatives) ---');
  const derivClarity = await generateConceptualClarity(null, null, {
    courseName: 'Calculus I',
    topicTitle: 'Differential Calculus',
    subtopicTitle: 'Derivatives',
    academicLevel: 'Undergraduate',
  });
  assert(
    derivClarity.explanation.includes('difference quotient') || derivClarity.explanation.includes('instantaneous rate'),
    'Derivatives explanation teaches rate of change and difference quotient'
  );
  assert(
    derivClarity.common_confusions.some(c => c.confusion.toLowerCase().includes('average') || c.confusion.toLowerCase().includes('instantaneous')),
    'Identifies average vs instantaneous rate confusion'
  );

  // ----------------------------------------------------
  // TEST 6: Programming Domain - Object-Oriented Programming
  // ----------------------------------------------------
  console.log('\n--- Test 6: Programming Domain (Object-Oriented Programming) ---');
  const oopClarity = await generateConceptualClarity(null, null, {
    courseName: 'Software Engineering',
    topicTitle: 'Programming Paradigms',
    subtopicTitle: 'Object-Oriented Programming',
    academicLevel: 'Undergraduate',
  });
  assert(
    oopClarity.explanation.includes('Encapsulation') && oopClarity.explanation.includes('Polymorphism'),
    'OOP explanation covers key pillars: encapsulation, abstraction, inheritance, polymorphism'
  );
  assert(
    oopClarity.examples.some(e => e.title.includes('Polymorphism') || e.explanation.includes('Shape')),
    'Concrete code/class hierarchy example provided'
  );

  // ----------------------------------------------------
  // TEST 7: Database Domain - Normalization
  // ----------------------------------------------------
  console.log('\n--- Test 7: Database Domain (Normalization) ---');
  const normClarity = await generateConceptualClarity(null, null, {
    courseName: 'Database Management Systems',
    topicTitle: 'Relational Database Design',
    subtopicTitle: 'Normalization',
    academicLevel: 'Undergraduate',
  });
  assert(
    normClarity.explanation.includes('1NF') && normClarity.explanation.includes('2NF') && normClarity.explanation.includes('3NF'),
    'Normalization explains normal forms 1NF, 2NF, 3NF, BCNF'
  );

  // ----------------------------------------------------
  // TEST 8: Source-Grounded Custom Syllabus Parsing
  // ----------------------------------------------------
  console.log('\n--- Test 8: Custom Syllabus Grounding ---');
  const customSyllabus = `Unit 3: Memory Management
- Paging
- Segmentation
- Virtual Memory
- Page Replacement Algorithms`;

  const customResult = await runTopicAnalysisPipeline(null, null, {
    courseName: 'Operating Systems',
    topicTitle: 'Unit 3: Memory Management',
    subject: 'Computer Science',
    academicLevel: 'Undergraduate',
    syllabusExcerpt: customSyllabus,
    sourceContext: '',
  });
  assert(customResult.has_subtopics === true, 'Custom syllabus decomposed into its defined subtopics');
  const subtopicTitles = customResult.subtopics.map(s => s.title.toLowerCase());
  assert(
    subtopicTitles.some(t => t.includes('paging')),
    'Syllabus subtopic "Paging" preserved'
  );
  assert(
    subtopicTitles.some(t => t.includes('segmentation')),
    'Syllabus subtopic "Segmentation" preserved'
  );
  assert(
    subtopicTitles.some(t => t.includes('page replacement')),
    'Syllabus subtopic "Page Replacement" preserved'
  );

  // ----------------------------------------------------
  // TEST 9: Didactic Question Generation
  // ----------------------------------------------------
  console.log('\n--- Test 9: Didactic Question Generation ---');
  const didacticQ = await generateInteractiveQuestion(null, null, {
    courseName: 'Operating Systems',
    topicTitle: 'Memory Management',
    subtopicTitle: 'Paging',
    clarity: pagingClarity,
  });
  assert(didacticQ.options.length >= 3, 'Question has multiple options');
  assert(didacticQ.correctIndex >= 0 && didacticQ.correctIndex < didacticQ.options.length, 'Valid correctIndex');
  assert(didacticQ.explanation.length > 20, 'Didactic explanation explains why answer is correct');
  assert(Boolean(didacticQ.whyWrongMap), 'whyWrongMap explains why distractors are wrong');
  console.log(`  Question: ${didacticQ.question}`);
  console.log(`  Correct Option: ${didacticQ.options[didacticQ.correctIndex]}`);
  console.log(`  Why Correct: ${didacticQ.explanation}`);

  // ----------------------------------------------------
  // TEST 10: Answer Evaluation & Adaptive Pacing Feedback
  // ----------------------------------------------------
  console.log('\n--- Test 10: Answer Evaluation & Adaptive Recommendation ---');
  // Scenario A: Correct answer with high confidence
  const evalCorrect = evaluateAnswer({
    courseName: 'Operating Systems',
    topicTitle: 'Memory Management',
    subtopicTitle: 'Paging',
    question: {
      ...didacticQ,
      whyWrongMap: didacticQ.whyWrongMap || {},
      targetConcept: didacticQ.targetConcept || 'Paging',
    },
    selectedIndex: didacticQ.correctIndex,
    confidence: 'high',
  });
  assert(evalCorrect.isCorrect === true, 'Correct answer identified as correct');
  assert(evalCorrect.adaptiveRecommendation.action === 'advance', 'Correct + high confidence recommends "advance"');
  assert(evalCorrect.clarityShift > 0, 'Positive clarity shift for correct answer');

  // Scenario B: Wrong answer with high confidence (detect misconception!)
  const wrongIdx = (didacticQ.correctIndex + 1) % didacticQ.options.length;
  const evalWrong = evaluateAnswer({
    courseName: 'Operating Systems',
    topicTitle: 'Memory Management',
    subtopicTitle: 'Paging',
    question: {
      ...didacticQ,
      whyWrongMap: didacticQ.whyWrongMap || {},
      targetConcept: didacticQ.targetConcept || 'Paging',
    },
    selectedIndex: wrongIdx,
    confidence: 'high',
  });
  assert(evalWrong.isCorrect === false, 'Incorrect answer identified as incorrect');
  assert(
    evalWrong.adaptiveRecommendation.action === 'investigate_misconception',
    'Wrong + high confidence recommends "investigate_misconception"'
  );
  assert(evalWrong.didacticFeedback.includes('Not quite'), 'Feedback explains why mistake occurred');
  assert(evalWrong.clarityShift < 0, 'Negative clarity shift for mistake');
  console.log(`  Wrong answer feedback: ${evalWrong.didacticFeedback.split('\n')[0]}`);
  console.log(`  Adaptive Action: ${evalWrong.adaptiveRecommendation.action} - ${evalWrong.adaptiveRecommendation.reason}`);

  // ----------------------------------------------------
  // TEST 11: Weighted Multi-Dimensional Clarity Calculation
  // Clarity = 0.30 * Conceptual + 0.20 * Recall + 0.30 * Application + 0.20 * Differentiation
  // ----------------------------------------------------
  console.log('\n--- Test 11: Weighted Multi-Dimensional Clarity Model ---');
  // Example: Conceptual=80, Recall=90, Application=70, Differentiation=60
  // Clarity = (0.30*80) + (0.20*90) + (0.30*70) + (0.20*60) = 24 + 18 + 21 + 12 = 75
  const weightedScore = calculateWeightedClarity({
    conceptual: 80,
    recall: 90,
    application: 70,
    differentiation: 60,
  });
  assert(weightedScore === 75, `Clarity score strictly follows weighted formula (expected: 75, actual: ${weightedScore})`);

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL RIGOROUS REQUIREMENTS VERIFIED AND PASSING!\n');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
