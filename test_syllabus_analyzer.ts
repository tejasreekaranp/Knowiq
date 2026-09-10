import { deterministicSourceExtractor, flattenUnitsToCourseTopics, formatTopicTitle, parseCandidateTopicStrings } from './src/server/sourceEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('=== TEST 1: User Case - UNIT-1 with comma-separated topics ===');
const userSyllabus = `
UNIT-1: probability notion, the axioms of probability, inference in temporal models, hidden markov models
UNIT-2: Markov Decision Processes, value iteration, policy iteration, reinforcement learning, Q-learning
`;

const result1 = deterministicSourceExtractor('Artificial Intelligence', userSyllabus);
assert(result1.units.length === 2, `Should have exactly 2 units, got ${result1.units.length}`);
assert(result1.units[0].title === 'Unit 1', `Unit 1 title should be 'Unit 1', got '${result1.units[0].title}'`);
assert(result1.units[0].topics.length === 4, `Unit 1 should have 4 topics from commas, got ${result1.units[0].topics.length}`);
assert(result1.units[0].topics[0].title === 'Probability Notion', `Topic 0 should be 'Probability Notion', got '${result1.units[0].topics[0].title}'`);
assert(result1.units[0].topics[1].title === 'The Axioms of Probability', `Topic 1 should be 'The Axioms of Probability', got '${result1.units[0].topics[1].title}'`);
assert(result1.units[0].topics[2].title === 'Inference in Temporal Models', `Topic 2 should be 'Inference in Temporal Models', got '${result1.units[0].topics[2].title}'`);
assert(result1.units[0].topics[3].title === 'Hidden Markov Models', `Topic 3 should be 'Hidden Markov Models', got '${result1.units[0].topics[3].title}'`);

assert(result1.units[1].title === 'Unit 2', `Unit 2 title should be 'Unit 2', got '${result1.units[1].title}'`);
assert(result1.units[1].topics.length === 5, `Unit 2 should have 5 topics, got ${result1.units[1].topics.length}`);
assert(result1.units[1].topics[0].title === 'Markov Decision Processes', `Unit 2 topic 0 should be 'Markov Decision Processes'`);
assert(result1.units[1].topics[4].title === 'Q-Learning' || result1.units[1].topics[4].title === 'Q-learning', `Unit 2 topic 4 should be Q-learning`);

const flatTopics1 = flattenUnitsToCourseTopics(result1, 'Artificial Intelligence');
assert(flatTopics1.length === 9, `Flattened topics should be 9, got ${flatTopics1.length}`);
assert(flatTopics1[0].title === 'Probability Notion', `Flattened title must be clean, got '${flatTopics1[0].title}'`);
assert(flatTopics1[0].unitTitle === 'Unit 1', `Unit title should be 'Unit 1', got '${flatTopics1[0].unitTitle}'`);
assert(flatTopics1[4].title === 'Markov Decision Processes', `Topic 5 should be Markov Decision Processes, got '${flatTopics1[4].title}'`);
assert(flatTopics1[4].unitTitle === 'Unit 2', `Unit title should be 'Unit 2', got '${flatTopics1[4].unitTitle}'`);

console.log('\n=== TEST 2: Syllabus WITHOUT any UNIT headers ===');
const unitlessSyllabus = `
probability notion, the axioms of probability, inference in temporal models, hidden markov models
`;

const result2 = deterministicSourceExtractor('Artificial Intelligence', unitlessSyllabus);
assert(result2.units.length === 1, `Should have 1 container unit when no units provided, got ${result2.units.length}`);
assert(result2.units[0].title === 'Artificial Intelligence', `Unit title should be course name, got '${result2.units[0].title}'`);
assert(!result2.units[0].title.startsWith('Unit '), `Unit title should NOT start with 'Unit ', got '${result2.units[0].title}'`);
assert(result2.units[0].topics.length === 4, `Should have 4 topics extracted from commas, got ${result2.units[0].topics.length}`);

const flatTopics2 = flattenUnitsToCourseTopics(result2, 'Artificial Intelligence');
assert(flatTopics2.length === 4, `Flattened topics should be 4, got ${flatTopics2.length}`);
assert(flatTopics2[0].unitTitle === undefined, `Unit title should be undefined when no units in source, got '${flatTopics2[0].unitTitle}'`);
assert(flatTopics2[0].sourceReference === 'Topic 1', `sourceReference should be 'Topic 1', got '${flatTopics2[0].sourceReference}'`);
assert(flatTopics2[1].sourceReference === 'Topic 2', `sourceReference should be 'Topic 2', got '${flatTopics2[1].sourceReference}'`);

console.log('\n=== TEST 3: UNIT with parenthetical sub-items ===');
const parenSyllabus = `
UNIT-1: Probability Basics
probability notion, axioms of probability, inference in temporal models (filtering, prediction, smoothing)
`;

const result3 = deterministicSourceExtractor('AI', parenSyllabus);
assert(result3.units.length === 1, `Should have 1 unit`);
assert(result3.units[0].title === 'Unit 1: Probability Basics', `Title should be 'Unit 1: Probability Basics', got '${result3.units[0].title}'`);
assert(result3.units[0].topics.length === 3, `Should have 3 topics, got ${result3.units[0].topics.length}`);
const topicWithSubs = result3.units[0].topics[2];
assert(topicWithSubs.title === 'Inference in Temporal Models', `Topic title should be 'Inference in Temporal Models', got '${topicWithSubs.title}'`);
assert(topicWithSubs.subtopics.length === 3, `Should have 3 subtopics extracted from parentheses, got ${topicWithSubs.subtopics.length}`);
assert(topicWithSubs.subtopics[0].title === 'Filtering', `Subtopic 0 should be Filtering, got '${topicWithSubs.subtopics[0].title}'`);
assert(topicWithSubs.subtopics[1].title === 'Prediction', `Subtopic 1 should be Prediction, got '${topicWithSubs.subtopics[1].title}'`);
assert(topicWithSubs.subtopics[2].title === 'Smoothing', `Subtopic 2 should be Smoothing, got '${topicWithSubs.subtopics[2].title}'`);

console.log('\n=== TEST 4: Roman Numerals & Module Headers ===');
const romanSyllabus = `
UNIT-I: Search Strategies
BFS, DFS, A* Search; Hill Climbing
MODULE-II: Knowledge Representation
Propositional Logic, First Order Logic, Ontological Engineering
`;

const result4 = deterministicSourceExtractor('AI Course', romanSyllabus);
assert(result4.units.length === 2, `Should have 2 units, got ${result4.units.length}`);
assert(result4.units[0].title === 'Unit I: Search Strategies', `Unit title should be 'Unit I: Search Strategies', got '${result4.units[0].title}'`);
assert(result4.units[0].topics.length === 4, `Unit I should have 4 topics (BFS, DFS, A* Search, Hill Climbing), got ${result4.units[0].topics.length}`);
assert(result4.units[0].topics[0].title === 'BFS', `Topic 0 should be BFS`);
assert(result4.units[0].topics[3].title === 'Hill Climbing', `Topic 3 should be Hill Climbing`);
assert(result4.units[1].title === 'Unit II: Knowledge Representation', `Unit II title should match, got '${result4.units[1].title}'`);
assert(result4.units[1].topics.length === 3, `Unit II should have 3 topics, got ${result4.units[1].topics.length}`);

console.log('\n=== TEST 5: Glued UNIT headers without newline (e.g. modelsUNIT-2:) ===');
const gluedSyllabus = 'UNIT-1: probability notion, the axioms of probability, inference in temporal models, hidden markov modelsUNIT-2: Markov Decision Processes, value iteration, policy iteration, reinforcement learning, Q-learning';

const result5 = deterministicSourceExtractor('AI Course', gluedSyllabus);
assert(result5.units.length === 2, `Should automatically split glued units into 2 units, got ${result5.units.length}`);
assert(result5.units[0].title === 'Unit 1', `Unit 1 title should be 'Unit 1', got '${result5.units[0].title}'`);
assert(result5.units[0].topics.length === 4, `Unit 1 should have 4 topics, got ${result5.units[0].topics.length}`);
assert(result5.units[0].topics[3].title === 'Hidden Markov Models', `Last topic of Unit 1 should be 'Hidden Markov Models', got '${result5.units[0].topics[3].title}'`);
assert(result5.units[1].title === 'Unit 2', `Unit 2 title should be 'Unit 2', got '${result5.units[1].title}'`);
assert(result5.units[1].topics.length === 5, `Unit 2 should have 5 topics, got ${result5.units[1].topics.length}`);
assert(result5.units[1].topics[0].title === 'Markov Decision Processes', `First topic of Unit 2 should be 'Markov Decision Processes', got '${result5.units[1].topics[0].title}'`);

console.log('\n=== ALL SYLLABUS ANALYZER TESTS PASSED SUCCESSFULLY! ===');
