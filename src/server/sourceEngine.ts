import { GoogleGenAI } from '@google/genai';
import {
  sourceExtractionSchema,
  SourceExtractionResult,
  ExtractedTopic,
  ExtractedSubtopic,
  geminiSubtopicContentSchema,
  geminiDiagnoseClaritySchema,
} from '../lib/schemas';
import { Topic, Subtopic, ClarityDiagnostic } from '../types';
import { generateConceptualClarity } from './learningEngine';

// Safe JSON parser helper
export function safeJsonParse<T = any>(str: string | null | undefined): T | null {
  if (!str) return null;
  try {
    const cleaned = str
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Deterministic Source Extractor (Faithful Parsing Without AI Hallucinations)
// ---------------------------------------------------------------------------

export function normalizeSyllabusFormatting(text: string): string {
  if (!text) return '';
  return text
    // Insert a newline before UNIT, MODULE, CHAPTER, PART, SECTION when glued to previous text without a newline
    .replace(/([^\r\n])\s*((?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*[0-9A-Za-zIVXLCDM]+)/gi, '$1\n$2')
    .trim();
}

export function formatTopicTitle(raw: string): string {
  const cleaned = raw
    .replace(/^(?:[\*\-\•\>]|\d+[\.\)])\s*/, '')
    .replace(/[;,]+$/, '')
    .trim();
  if (!cleaned) return '';

  // If already mixed-case with uppercase letters (e.g. "Q-Learning", "A* Search", "Markov Decision Processes")
  // keep as is
  const hasLower = /[a-z]/.test(cleaned);
  const hasUpper = /[A-Z]/.test(cleaned);
  if (hasLower && hasUpper) {
    return cleaned;
  }

  // If single word all uppercase and short (<= 5 chars), it's an acronym like BFS, DFS, CPU, PCB, SQL
  if (!hasLower && hasUpper && cleaned.length <= 5) {
    return cleaned;
  }

  // Otherwise convert all-lower or all-upper to Title Case while preserving short acronyms
  const smallWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with']);
  return cleaned
    .split(/\s+/)
    .map((word, idx) => {
      if (word.length <= 5 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
        return word;
      }
      const lower = word.toLowerCase();
      if (idx > 0 && smallWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

export function splitByCommaOrSemicolon(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '(' || char === '[' || char === '{') {
      parenDepth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}') {
      if (parenDepth > 0) parenDepth--;
      current += char;
    } else if ((char === ',' || char === ';') && parenDepth === 0) {
      if (current.trim().length >= 2) {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length >= 2) {
    parts.push(current.trim());
  }

  return parts;
}

export function parseCandidateTopicStrings(rawText: string): string[] {
  if (!rawText) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => {
      const lower = l.toLowerCase();
      return (
        l.length > 0 &&
        !lower.startsWith('textbook') &&
        !lower.startsWith('reference') &&
        !lower.startsWith('prescribed book') &&
        !lower.startsWith('prerequisite')
      );
    });

  const topics: string[] = [];

  for (const line of lines) {
    // Strip bullet points like -, *, •, 1., 1.1, etc.
    const cleaned = line.replace(/^(?:[\*\-\•\>]|\d+[\.\)])\s*/, '').trim();
    if (!cleaned) continue;

    // EVERY COMMA OR SEMICOLON OUTSIDE PARENTHESES SEPARATES A TOPIC
    const parts = splitByCommaOrSemicolon(cleaned);
    for (const part of parts) {
      if (part.length >= 2) {
        topics.push(part);
      }
    }
  }

  return topics;
}

function convertCandidateToExtractedTopic(
  rawCandidate: string,
  unitRef: string,
  _orderIdx: number
): ExtractedTopic {
  const trimmed = rawCandidate.trim();

  // Check if candidate has parenthetical sub-items: e.g. "Inference in Temporal Models (filtering, prediction, smoothing)"
  const parenMatch = trimmed.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch && parenMatch[1].trim().length >= 2) {
    const mainTitle = formatTopicTitle(parenMatch[1]);
    const subRaw = parenMatch[2]
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);

    const subtopics: ExtractedSubtopic[] = subRaw.map((st, sIdx) => ({
      title: formatTopicTitle(st),
      source_reference: `${unitRef} → ${mainTitle} → ${formatTopicTitle(st)}`,
      source_excerpt: st,
      concepts: extractConceptsFromTitle(st),
      prerequisites: sIdx > 0 ? [formatTopicTitle(subRaw[sIdx - 1])] : [],
      derived: false,
      derived_from: [],
    }));

    return {
      title: mainTitle,
      source_reference: `${unitRef} → ${mainTitle}`,
      source_excerpt: trimmed,
      subtopics,
    };
  }

  // Topic without parenthetical subtopics
  const cleanTitle = formatTopicTitle(trimmed);
  return {
    title: cleanTitle,
    source_reference: `${unitRef} → ${cleanTitle}`,
    source_excerpt: trimmed,
    subtopics: [],
  };
}

export function deterministicSourceExtractor(
  courseName: string,
  syllabusText?: string,
  materialsSummary?: string
): SourceExtractionResult {
  const cleanName = (courseName || 'Course').trim();
  const rawText = normalizeSyllabusFormatting((syllabusText || materialsSummary || '').trim());

  // If no material provided at all, create a clearly labeled starter structure
  if (!rawText || rawText.length < 10) {
    return createStarterCurriculum(cleanName);
  }

  // Check for explicit Unit / Chapter / Module patterns (e.g. UNIT-1, UNIT 1, Unit I, Module-1, Chapter 1)
  const unitLineRegex = /(?:^|\n)[ \t]*(?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*([0-9A-Za-zIVXLCDM]+)(?:[ \t]*[:\-\.][ \t]*([^\r\n]*)|[ \t]*([^\r\n]*))/gi;
  const unitMatches = Array.from(rawText.matchAll(unitLineRegex));

  if (unitMatches.length >= 1) {
    const units: SourceExtractionResult['units'] = [];

    for (let i = 0; i < unitMatches.length; i++) {
      const match = unitMatches[i];
      const unitNum = match[1].trim();
      const headerText = (match[2] || match[3] || '').trim();
      const startIndex = match.index! + match[0].length;
      const endIndex = i + 1 < unitMatches.length ? unitMatches[i + 1].index! : rawText.length;
      const sectionBody = rawText.slice(startIndex, endIndex).trim();

      // Determine unit title vs topics on header line
      let unitTitle = `Unit ${unitNum}`;
      const headerCandidates: string[] = [];

      if (headerText) {
        if (headerText.includes(',') || headerText.includes(';')) {
          // If header has dash/colon before commas: e.g. "Foundations - topic 1, topic 2"
          const dashIdx = headerText.search(/[:\-]/);
          if (dashIdx > 0 && dashIdx < 40) {
            const prefix = headerText.slice(0, dashIdx).trim();
            const rest = headerText.slice(dashIdx + 1).trim();
            if (prefix.length >= 2) {
              unitTitle = `Unit ${unitNum}: ${formatTopicTitle(prefix)}`;
            }
            headerCandidates.push(...parseCandidateTopicStrings(rest));
          } else {
            // Whole header text is comma-separated topics
            headerCandidates.push(...parseCandidateTopicStrings(headerText));
          }
        } else {
          // Single unit title on header line, e.g. "UNIT-1: Machine Learning"
          unitTitle = `Unit ${unitNum}: ${formatTopicTitle(headerText)}`;
        }
      }

      // Collect topics from body
      const bodyCandidates = parseCandidateTopicStrings(sectionBody);
      const allCandidates = [...headerCandidates, ...bodyCandidates];

      const topics: ExtractedTopic[] = [];
      if (allCandidates.length === 0) {
        topics.push({
          title: formatTopicTitle(headerText || `Unit ${unitNum} Core`),
          source_reference: `Unit ${unitNum}`,
          source_excerpt: sectionBody.slice(0, 200) || unitTitle,
          subtopics: [],
        });
      } else {
        allCandidates.forEach((cand, idx) => {
          topics.push(convertCandidateToExtractedTopic(cand, `Unit ${unitNum}`, idx));
        });
      }

      units.push({
        title: unitTitle,
        source_reference: `Unit ${unitNum}`,
        topics,
      });
    }

    return {
      source_summary: `Faithfully extracted ${units.length} unit(s) and ${units.reduce((acc, u) => acc + u.topics.length, 0)} topic(s) directly from student syllabus.`,
      is_generic_starter: false,
      units,
    };
  }

  // If no explicit "Unit X" markers found, parse as unstructured topics without fake units
  return parseUnstructuredSource(cleanName, rawText);
}

function parseUnstructuredSource(courseName: string, text: string): SourceExtractionResult {
  const candidateTopics = parseCandidateTopicStrings(text);

  const topics: ExtractedTopic[] = [];
  if (candidateTopics.length === 0) {
    topics.push({
      title: formatTopicTitle(courseName),
      source_reference: 'Curriculum',
      source_excerpt: text.slice(0, 200),
      subtopics: [],
    });
  } else {
    candidateTopics.forEach((cand, idx) => {
      topics.push(convertCandidateToExtractedTopic(cand, 'Curriculum', idx));
    });
  }

  return {
    source_summary: `Structured ${topics.length} topics directly from student syllabus for ${courseName}.`,
    is_generic_starter: false,
    units: [
      {
        title: courseName,
        source_reference: 'Curriculum',
        topics,
      },
    ],
  };
}

function createStarterCurriculum(courseName: string): SourceExtractionResult {
  const cLower = courseName.toLowerCase();
  const starterNote = `No custom syllabus was provided. Created a general starter curriculum for "${courseName}". You can edit the syllabus at any time to ground it in your exact course material.`;

  if (cLower.includes('operat') || cLower.includes('os')) {
    return {
      source_summary: starterNote,
      is_generic_starter: true,
      units: [
        {
          title: 'Unit 1: Process Management & CPU Scheduling',
          source_reference: 'General Starter Curriculum',
          topics: [
            {
              title: 'Process Management',
              source_reference: 'Starter 1.1',
              source_excerpt: 'Process models, states, PCB, context switching',
              subtopics: [
                {
                  title: 'Process Concept, States & PCB',
                  source_reference: 'Starter 1.1.1',
                  source_excerpt: 'Process states, PCB tracking, context switch overhead',
                  concepts: ['Process Control Block', 'Process States', 'Context Switching'],
                  prerequisites: [],
                  derived: true,
                  derived_from: ['Operating Systems Fundamentals'],
                },
                {
                  title: 'CPU Scheduling Algorithms (FCFS, SJF, Round Robin)',
                  source_reference: 'Starter 1.1.2',
                  source_excerpt: 'CPU scheduling criteria, preemptive vs non-preemptive',
                  concepts: ['Round Robin', 'Time Quantum', 'Convoy Effect', 'Shortest Job First'],
                  prerequisites: ['Process Concept, States & PCB'],
                  derived: true,
                  derived_from: ['Process Management'],
                },
              ],
            },
          ],
        },
        {
          title: 'Unit 2: Memory Management',
          source_reference: 'General Starter Curriculum',
          topics: [
            {
              title: 'Virtual Memory & Paging',
              source_reference: 'Starter 2.1',
              source_excerpt: 'Address spaces, page tables, TLB, page replacement',
              subtopics: [
                {
                  title: 'Paging & Address Translation',
                  source_reference: 'Starter 2.1.1',
                  source_excerpt: 'Logical vs physical address, frame allocation',
                  concepts: ['Logical Address', 'Physical Frame', 'Page Offset'],
                  prerequisites: [],
                  derived: true,
                  derived_from: ['Memory Architecture'],
                },
                {
                  title: 'Page Tables & TLB Mechanics',
                  source_reference: 'Starter 2.1.2',
                  source_excerpt: 'Multi-level page tables, TLB hit ratio and miss penalty',
                  concepts: ['Page Tables', 'TLB', 'Translation Lookaside Buffer', 'Address Translation'],
                  prerequisites: ['Paging & Address Translation'],
                  derived: true,
                  derived_from: ['Virtual Memory'],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  if (cLower.includes('calculus') || cLower.includes('math')) {
    return {
      source_summary: starterNote,
      is_generic_starter: true,
      units: [
        {
          title: 'Unit 1: Limits & Continuity',
          source_reference: 'General Starter Curriculum',
          topics: [
            {
              title: 'Foundations of Limits',
              source_reference: 'Starter 1.1',
              source_excerpt: 'Definition of limits, one-sided limits, continuity',
              subtopics: [
                {
                  title: 'Limit Concept & Evaluation',
                  source_reference: 'Starter 1.1.1',
                  source_excerpt: 'Evaluating limits algebraically and graphically',
                  concepts: ['Limit Laws', 'Indeterminate Forms', 'Approaching Values'],
                  prerequisites: [],
                  derived: true,
                  derived_from: ['Precalculus Algebra'],
                },
                {
                  title: 'Continuity & Intermediate Value Theorem',
                  source_reference: 'Starter 1.1.2',
                  source_excerpt: 'Points of discontinuity and IVT application',
                  concepts: ['Continuous Functions', 'Removable Discontinuity', 'IVT'],
                  prerequisites: ['Limit Concept & Evaluation'],
                  derived: true,
                  derived_from: ['Limits'],
                },
              ],
            },
          ],
        },
        {
          title: 'Unit 2: Derivatives & Differentiation Rules',
          source_reference: 'General Starter Curriculum',
          topics: [
            {
              title: 'Differential Calculus',
              source_reference: 'Starter 2.1',
              source_excerpt: 'Power rule, product rule, quotient rule, chain rule',
              subtopics: [
                {
                  title: 'Fundamental Derivative Rules',
                  source_reference: 'Starter 2.1.1',
                  source_excerpt: 'Power, product, and quotient rules',
                  concepts: ['Instantaneous Rate of Change', 'Tangent Slope', 'Power Rule'],
                  prerequisites: ['Continuity & Intermediate Value Theorem'],
                  derived: true,
                  derived_from: ['Differential Calculus'],
                },
                {
                  title: 'Chain Rule for Composite Functions',
                  source_reference: 'Starter 2.1.2',
                  source_excerpt: 'Differentiating outer and inner functions',
                  concepts: ['Composite Functions', 'Chain Rule', 'Inner Derivative'],
                  prerequisites: ['Fundamental Derivative Rules'],
                  derived: true,
                  derived_from: ['Derivatives'],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    source_summary: starterNote,
    is_generic_starter: true,
    units: [
      {
        title: `Unit 1: Core Foundations of ${courseName}`,
        source_reference: 'General Starter Curriculum',
        topics: [
          {
            title: `Foundations of ${courseName}`,
            source_reference: 'Starter 1.1',
            source_excerpt: `Foundational principles and terminology of ${courseName}`,
            subtopics: [
              {
                title: `${courseName} Principles & Core Concepts`,
                source_reference: 'Starter 1.1.1',
                source_excerpt: `Essential vocabulary, definitions, and model assumptions in ${courseName}`,
                concepts: [`${courseName} Basics`, 'Definitions', 'Core Models'],
                prerequisites: [],
                derived: true,
                derived_from: ['Subject Overview'],
              },
              {
                title: `Structural Models & Methodology`,
                source_reference: 'Starter 1.1.2',
                source_excerpt: `Analytical methods and structural patterns in ${courseName}`,
                concepts: ['Framework Analysis', 'Methodology', 'Problem Solving'],
                prerequisites: [`${courseName} Principles & Core Concepts`],
                derived: true,
                derived_from: ['Foundations'],
              },
            ],
          },
        ],
      },
      {
        title: `Unit 2: Advanced Applications & Techniques`,
        source_reference: 'General Starter Curriculum',
        topics: [
          {
            title: `Applied ${courseName}`,
            source_reference: 'Starter 2.1',
            source_excerpt: `Case studies and complex operations in ${courseName}`,
            subtopics: [
              {
                title: `Operational Techniques & Mechanics`,
                source_reference: 'Starter 2.1.1',
                source_excerpt: `Step-by-step procedures and execution rules in ${courseName}`,
                concepts: ['Procedures', 'Execution Rules', 'Verification'],
                prerequisites: [`Structural Models & Methodology`],
                derived: true,
                derived_from: ['Applications'],
              },
              {
                title: `Analysis, Optimization & Best Practices`,
                source_reference: 'Starter 2.1.2',
                source_excerpt: `Edge cases, trade-offs, and critical evaluation in ${courseName}`,
                concepts: ['Trade-offs', 'Critical Evaluation', 'Optimization'],
                prerequisites: [`Operational Techniques & Mechanics`],
                derived: true,
                derived_from: ['Advanced Topics'],
              },
            ],
          },
        ],
      },
    ],
  };
}

function extractConceptsFromTitle(title: string): string[] {
  const cleaned = title.replace(/^(?:Unit|Module|Chapter)\s*\d+[:\-\s]*/i, '').trim();
  const tokens = cleaned
    .split(/[\s,&/()]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !['and', 'for', 'the', 'with', 'part', 'core', 'theory'].includes(t.toLowerCase()));

  const concepts = [cleaned];
  for (const token of tokens) {
    if (!concepts.includes(token)) {
      concepts.push(token);
    }
  }
  return concepts.slice(0, 5);
}

// ---------------------------------------------------------------------------
// 2. AI Source Extraction Engine (Faithful Structured Decomposition)
// ---------------------------------------------------------------------------
export async function extractCourseSource(
  ai: GoogleGenAI | null,
  callGeminiFn: (ai: GoogleGenAI | null, prompt: string, opts?: any) => Promise<string | null>,
  params: {
    courseName: string;
    subject?: string;
    academicLevel?: string;
    syllabusText?: string;
    materialsSummary?: string;
  }
): Promise<SourceExtractionResult> {
  const { courseName, subject, academicLevel, syllabusText, materialsSummary } = params;

  if ((!syllabusText || syllabusText.trim().length < 10) && (!materialsSummary || materialsSummary.trim().length < 10)) {
    return createStarterCurriculum(courseName);
  }

  const rawInput = [
    syllabusText ? `STUDENT SYLLABUS:\n${normalizeSyllabusFormatting(syllabusText)}` : '',
    materialsSummary ? `UPLOADED NOTES / STUDY MATERIALS:\n${normalizeSyllabusFormatting(materialsSummary)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  if (ai) {
    const prompt = `You are the KnowIQ Source-Grounded Curriculum Architect.
Your PRIMARY AND ABSOLUTE RESPONSIBILITY is to faithfully extract and structure WHAT THE STUDENT ACTUALLY PROVIDED.

COURSE NAME: "${courseName}"
SUBJECT: "${subject || 'General'}"
ACADEMIC LEVEL: "${academicLevel || 'Undergraduate'}"

STUDENT PROVIDED SOURCE:
"""
${rawInput}
"""

CRITICAL SYLLABUS DECOMPOSITION RULES:
1. CONDITIONAL UNIT BREAKDOWN:
   - Break the syllabus into units ONLY IF the student input explicitly contains unit markers (e.g. "UNIT-1", "Unit 1", "UNIT I", "MODULE 1", "CHAPTER 1", "PART 1").
   - If the student input does NOT contain explicit unit headers, DO NOT invent fake units like "Unit 1" or "Unit 2". In that case, return EXACTLY 1 unit with title set to "${courseName}" and source_reference "Curriculum".

2. COMMA = INDIVIDUAL TOPIC (CRITICAL RULE):
   - In syllabus outlines, EACH COMMA (",") OR SEMICOLON (";") SEPARATES AN INDIVIDUAL TOPIC!
   - NEVER combine a comma-separated list into a single topic.
   - For example, if a line or unit says:
     "probability notion, the axioms of probability, inference in temporal models, hidden markov models"
     You MUST output 4 separate topic objects:
     - Topic 1: "Probability Notion"
     - Topic 2: "The Axioms of Probability"
     - Topic 3: "Inference in Temporal Models"
     - Topic 4: "Hidden Markov Models"
   - Every single comma-separated topic must be preserved faithfully in sequence.

3. SUBTOPICS RULE:
   - If a topic item has explicit sub-items in parentheses or colons, extract those as subtopics.
   - If a topic is focused (e.g. "The Axioms of Probability"), provide 0 to 2 subtopics or leave subtopics as [].
   - Do NOT force artificial subtopics on focused concepts.

4. TRACEABILITY:
   - For every unit and topic, provide "source_reference" (e.g. "Unit 1" or "Curriculum") and "source_excerpt" (short quote or phrase from student text).
   - If subtopics exist, provide "concepts" (array of key terms) and "prerequisites".

Output strictly valid JSON conforming to this schema:
{
  "source_summary": "Faithful extraction summary describing what was extracted from the student input",
  "is_generic_starter": false,
  "units": [
    {
      "title": "Unit 1: Title (or '${courseName}' if no units in source)",
      "source_reference": "Unit 1",
      "topics": [
        {
          "title": "Topic Title",
          "source_reference": "Unit 1 -> Topic Title",
          "source_excerpt": "Excerpt from source",
          "subtopics": [
            {
              "title": "Subtopic Title",
              "source_reference": "Unit 1 -> Section 1.1",
              "source_excerpt": "Excerpt from source",
              "concepts": ["Concept 1"],
              "prerequisites": [],
              "derived": false,
              "derived_from": []
            }
          ]
        }
      ]
    }
  ]
}
Output ONLY valid JSON.`;

    try {
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: 'application/json' });
      const parsed = safeJsonParse(raw);
      const validation = sourceExtractionSchema.safeParse(parsed);

      if (validation.success && validation.data.units.length > 0) {
        return validation.data;
      }
    } catch (err) {
      console.warn('[sourceEngine] Gemini extraction error, falling back to deterministic parser:', err);
    }
  }

  return deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
}

// ---------------------------------------------------------------------------
// 3. Convert Units into Flat Topics Structure for DB & App Compatibility
// ---------------------------------------------------------------------------
export function flattenUnitsToCourseTopics(
  extraction: SourceExtractionResult,
  _courseTitle: string
): Topic[] {
  const topics: Topic[] = [];
  let topicOrder = 1;

  for (const unit of extraction.units) {
    const isExplicitUnit = /^(?:unit|module|chapter|part|section)\b/i.test(unit.title);

    for (const top of unit.topics) {
      const subtopics: Subtopic[] = (top.subtopics || []).map((st, sIdx) => ({
        id: `sub-${Date.now()}-${topicOrder}-${sIdx + 1}`,
        title: st.title,
        order: sIdx + 1,
        isCompleted: false,
        isLocked: topicOrder > 1 || sIdx > 0,
        clarityScore: 0,
        daysUntilRevision: 7,
        estimatedRetention: 100,
        sourceReference: st.source_reference || top.source_reference || unit.source_reference,
        sourceExcerpt: st.source_excerpt || top.source_excerpt || '',
        concepts: st.concepts || extractConceptsFromTitle(st.title),
        prerequisites: st.prerequisites || [],
        derived: st.derived || false,
        derivedFrom: st.derived_from || [],
      }));

      topics.push({
        id: `top-${Date.now()}-${topicOrder}`,
        title: top.title,
        order: topicOrder,
        isCompleted: false,
        isLocked: topicOrder > 1,
        unitTitle: isExplicitUnit ? unit.title : undefined,
        sourceReference: isExplicitUnit ? (top.source_reference || unit.source_reference) : `Topic ${topicOrder}`,
        sourceExcerpt: top.source_excerpt || '',
        hasSubtopics: subtopics.length > 0 ? true : undefined,
        subtopics,
      });

      topicOrder++;
    }
  }

  return topics;
}

// ---------------------------------------------------------------------------
// 4. Source-Grounded Subtopic Content Generator
// ---------------------------------------------------------------------------
export async function generateSourceGroundedContent(
  ai: GoogleGenAI | null,
  callGeminiFn: (ai: GoogleGenAI | null, prompt: string, opts?: any) => Promise<string | null>,
  params: {
    courseName: string;
    topicTitle: string;
    subtopicTitle: string;
    existingClarity?: number;
    sourceReference?: string;
    sourceExcerpt?: string;
    concepts?: string[];
    prerequisites?: string[];
    courseSyllabus?: string;
    academicLevel?: string;
  }
) {
  const {
    courseName,
    topicTitle,
    subtopicTitle,
    existingClarity = 50,
    sourceReference,
    sourceExcerpt,
    concepts = [],
    prerequisites = [],
    academicLevel = 'Undergraduate',
  } = params;

  if (ai) {
    const conceptsList = concepts.length > 0 ? concepts.join(', ') : subtopicTitle;
    const prompt = `You are the KnowIQ AI Teacher and Adaptive Learning Engine.
YOUR INSTRUCTION IS TO TEACH EXACTLY THIS SELECTED LEARNING UNIT:
- Subtopic: "${subtopicTitle}"
- Parent Topic / Unit: "${topicTitle}"
- Course: "${courseName}" (${academicLevel})
- Key Concepts: ${conceptsList}
- Source Reference: ${sourceReference || 'From Course Syllabus'}
- Source Excerpt: "${sourceExcerpt || subtopicTitle}"
- Prerequisites: ${prerequisites.join(', ') || 'None'}
- Student Clarity Level: ${existingClarity}%

STRICT TEACHING RULES (PRINCIPLE 34 & 35):
1. TEACH ONLY THE SELECTED LEARNING UNIT: "${subtopicTitle}".
   - Do NOT give a broad, generic course overview of "${courseName}".
   - Focus every explanation, example, note, and question on "${subtopicTitle}" and concepts (${conceptsList}).
2. GROUNDED IN SOURCE:
   - Use the source context as primary grounding. General knowledge is for explaining "${subtopicTitle}", never for drifting to unrelated topics.
3. PRACTICE & QUIZ GROUNDING:
   - All 5 questions in "hardQuiz" MUST specifically test "${subtopicTitle}" and the concepts (${conceptsList}).
   - Question 1: "conceptual" (understanding why and how ${subtopicTitle} works)
   - Question 2: "recall" (core definitions, formulas, or rules of ${subtopicTitle})
   - Question 3: "application" (applying ${subtopicTitle} to a concrete scenario or calculation)
   - Question 4: "differentiation" (distinguishing ${subtopicTitle} from related or adjacent concepts)
   - Question 5: "application" or "differentiation" (edge case or trade-off in ${subtopicTitle})
   - NEVER generate generic or unrelated questions.

Output strict JSON adhering to this schema:
{
  "conceptual": {
    "quick": "2-sentence intuition focused specifically on ${subtopicTitle}",
    "standard": "Clear educational explanation with concrete examples of ${subtopicTitle}",
    "deep": "Rigorous technical/mathematical breakdown, inner mechanics, and trade-offs of ${subtopicTitle}",
    "expert": "Formal definitions, edge cases, lower-level mechanics, or proofs for ${subtopicTitle}",
    "whatIsIt": "Direct answer to What is ${subtopicTitle}?",
    "whyExists": "Direct answer to Why does ${subtopicTitle} exist?",
    "problemSolved": "Direct answer to What problem does ${subtopicTitle} solve?",
    "keyTakeaway": "Single memorable punchline or rule for ${subtopicTitle}"
  },
  "interactive": {
    "fillBlank": {
      "question": "Sentence testing a key definition in ${subtopicTitle}:",
      "preText": "pre-text",
      "missingWord": "the key concept term",
      "postText": "post-text.",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "hint": "helpful hint",
      "explanation": "clear explanation"
    },
    "matching": [
      { "id": "m1", "term": "Term 1 from ${subtopicTitle}", "definition": "Definition 1" },
      { "id": "m2", "term": "Term 2 from ${subtopicTitle}", "definition": "Definition 2" },
      { "id": "m3", "term": "Term 3 from ${subtopicTitle}", "definition": "Definition 3" },
      { "id": "m4", "term": "Term 4 from ${subtopicTitle}", "definition": "Definition 4" }
    ],
    "ordering": {
      "title": "Logical Sequence in ${subtopicTitle}",
      "instruction": "Order the steps/stages:",
      "items": [
        { "id": "o1", "text": "Step 1", "correctOrder": 1 },
        { "id": "o2", "text": "Step 2", "correctOrder": 2 },
        { "id": "o3", "text": "Step 3", "correctOrder": 3 },
        { "id": "o4", "text": "Step 4", "correctOrder": 4 }
      ]
    }
  },
  "deepRevision": {
    "detailedNotes": [
      "Key bullet 1 about ${subtopicTitle}",
      "Key bullet 2 about ${subtopicTitle}",
      "Key bullet 3 about ${subtopicTitle}"
    ],
    "comparisonTable": {
      "title": "${subtopicTitle} Comparison Matrix",
      "headers": ["Aspect", "${subtopicTitle}", "Alternative / Counterpart", "Key Distinction"],
      "rows": [
        ["Core Function", "...", "...", "..."],
        ["Behavior", "...", "...", "..."],
        ["Trade-off", "...", "...", "..."]
      ]
    },
    "commonPitfalls": [
      "Misconception 1 students have with ${subtopicTitle}",
      "Misconception 2 students have with ${subtopicTitle}"
    ],
    "mentalModelOrMnemonic": "Mnemonic or mental model for ${subtopicTitle}"
  },
  "hardQuiz": [
    {
      "id": "q1",
      "question": "Question specifically testing ${subtopicTitle}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "category": "conceptual",
      "explanation": "Explanation referring to ${subtopicTitle}..."
    },
    {
      "id": "q2",
      "question": "Question specifically testing ${subtopicTitle}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "category": "recall",
      "explanation": "Explanation referring to ${subtopicTitle}..."
    },
    {
      "id": "q3",
      "question": "Question specifically testing ${subtopicTitle}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "category": "application",
      "explanation": "Explanation referring to ${subtopicTitle}..."
    },
    {
      "id": "q4",
      "question": "Question specifically testing ${subtopicTitle}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "category": "differentiation",
      "explanation": "Explanation referring to ${subtopicTitle}..."
    },
    {
      "id": "q5",
      "question": "Question specifically testing ${subtopicTitle}...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "category": "application",
      "explanation": "Explanation referring to ${subtopicTitle}..."
    }
  ],
  "externalResources": [
    {
      "type": "video",
      "title": "Visual Guide to ${subtopicTitle}",
      "source": "Educational Resource",
      "description": "Visual breakdown of ${subtopicTitle}",
      "url": "https://www.youtube.com/results?search_query=${encodeURIComponent(subtopicTitle + ' ' + courseName)}",
      "tag": "Video"
    }
  ]
}
Output strictly valid JSON.`;

    try {
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: 'application/json' });
      const parsed = safeJsonParse(raw);
      const validation = geminiSubtopicContentSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }
    } catch (err) {
      console.warn('[sourceEngine] Gemini subtopic-content error, falling back to dynamic generator:', err);
    }
  }

  return await buildDynamicGroundedPacket(courseName, topicTitle, subtopicTitle, concepts, sourceExcerpt);
}

// ---------------------------------------------------------------------------
// 5. Dynamic Fallback Packet (Conceptually Grounded Without Generic Template Drift)
// ---------------------------------------------------------------------------
async function buildDynamicGroundedPacket(
  courseName: string,
  topicTitle: string,
  subtopicTitle: string,
  concepts: string[],
  sourceExcerpt?: string
) {
  const clarity = await generateConceptualClarity(null, null, {
    courseName,
    topicTitle,
    subtopicTitle,
    concepts,
    sourceExcerpt,
    academicLevel: 'Undergraduate',
  });

  const primaryConcept = clarity.key_concepts[0]?.term || concepts[0] || subtopicTitle;
  const primaryConceptExpl = clarity.key_concepts[0]?.explanation || clarity.summary;
  const secondaryConcept = clarity.key_concepts[1]?.term || `${subtopicTitle} Mechanism`;
  const secondaryConceptExpl = clarity.key_concepts[1]?.explanation || clarity.explanation;
  const firstExample = clarity.examples[0] || { title: 'Practical Application', explanation: 'Illustrates the mechanism in a real-world scenario.' };
  const firstConfusion = clarity.common_confusions[0] || {
    confusion: `Confusing ${subtopicTitle} with related adjacent concepts.`,
    clarification: `Focus on the exact problem ${subtopicTitle} solves: ${clarity.summary}`,
  };

  const paragraphs = clarity.explanation.split('\n\n').filter(p => p.trim().length > 0);
  const whatIsIt = paragraphs[0] || clarity.summary;
  const whyExists = paragraphs[1] || `To solve key architectural and computational challenges in ${topicTitle}.`;
  const problemSolved = paragraphs[2] || `Provides systematic control, determinism, and execution guarantees.`;

  return {
    conceptual: {
      quick: clarity.summary,
      standard: clarity.explanation,
      deep: `${clarity.explanation}\n\n### Core Key Concepts:\n${clarity.key_concepts.map(k => `• **${k.term}**: ${k.explanation}`).join('\n')}\n\n### Practical Demonstrations:\n${clarity.examples.map(e => `• **${e.title}**: ${e.explanation}`).join('\n')}`,
      expert: `${clarity.explanation}\n\n### Common Pitfalls & Confusions:\n${clarity.common_confusions.map(c => `• **Misconception**: ${c.confusion}\n  **Clarification**: ${c.clarification}`).join('\n')}`,
      whatIsIt,
      whyExists,
      problemSolved,
      keyTakeaway: clarity.key_takeaways[0] || `${subtopicTitle} is essential for reliable, predictable operation.`,
      analogy: clarity.analogy,
      examples: clarity.examples,
      common_confusions: clarity.common_confusions,
      key_concepts: clarity.key_concepts,
      key_takeaways: clarity.key_takeaways,
      summary: clarity.summary,
      explanation: clarity.explanation,
    },
    interactive: {
      fillBlank: {
        question: `Complete the foundational statement regarding ${subtopicTitle}:`,
        preText: `In the context of ${topicTitle},`,
        missingWord: primaryConcept,
        postText: `serves as the primary mechanism for systematic operation.`,
        options: [primaryConcept, 'Random Access Bypass', 'Arbitrary Memory Allocation', 'Unchecked Execution'],
        hint: `Focus on the core concept: ${primaryConcept}`,
        explanation: `${primaryConcept} is defined as: ${primaryConceptExpl}`,
      },
      matching: clarity.key_concepts.slice(0, 4).map((k, idx) => ({
        id: `m${idx + 1}`,
        term: k.term,
        definition: k.explanation,
      })),
      ordering: {
        title: `${subtopicTitle} Execution Sequence`,
        instruction: `Arrange the logical stages of ${subtopicTitle} from first to last:`,
        items: [
          { id: 'o1', text: `1. Input request arrives and preconditions are validated for ${primaryConcept}`, correctOrder: 1 },
          { id: 'o2', text: `2. Core operational mechanism of ${subtopicTitle} processes the state transition`, correctOrder: 2 },
          { id: 'o3', text: `3. Boundary invariants and safety constraints are checked`, correctOrder: 3 },
          { id: 'o4', text: `4. Output or state update is committed to ${topicTitle}`, correctOrder: 4 },
        ],
      },
    },
    deepRevision: {
      detailedNotes: clarity.key_takeaways.length > 0 ? clarity.key_takeaways : [
        `Core Principle: ${clarity.summary}`,
        `Mechanism: ${whatIsIt}`,
        `Avoid Confusion: ${firstConfusion.clarification}`,
      ],
      comparisonTable: {
        title: `${subtopicTitle} Comparative Breakdown`,
        headers: ['Dimension', subtopicTitle, 'Common Misconception', 'Key Distinction'],
        rows: [
          ['Primary Role', primaryConcept, firstConfusion.confusion, firstConfusion.clarification],
          ['Execution Mechanism', secondaryConcept, 'Assumed to be unpredictable or ad-hoc', 'Follows deterministic invariants'],
          ['Key Takeaway', clarity.key_takeaways[0] || subtopicTitle, 'Over-simplification without edge cases', 'Provides rigorous guarantees'],
        ],
      },
      commonPitfalls: clarity.common_confusions.map(c => `${c.confusion} -> ${c.clarification}`),
      mentalModelOrMnemonic: clarity.analogy || `Memory Anchor: "${primaryConcept} drives ${subtopicTitle}."`,
    },
    hardQuiz: [
      {
        id: 'q1',
        question: `Which statement best describes the fundamental purpose of ${subtopicTitle}?`,
        options: [
          whatIsIt,
          `To bypass architectural checks and randomize execution order`,
          `To eliminate the need for ${topicTitle} entirely`,
          `To convert high-level instructions into unverified raw text`,
        ],
        correctIndex: 0,
        category: 'conceptual',
        explanation: `Correct! ${whatIsIt}`,
      },
      {
        id: 'q2',
        question: `In ${subtopicTitle}, what is the defining characteristic of ${primaryConcept}?`,
        options: [
          primaryConceptExpl,
          'It acts as an undocumented workaround with no defined behavior',
          'It operates without maintaining system invariants',
          'It is completely unrelated to the operation of the system',
        ],
        correctIndex: 0,
        category: 'recall',
        explanation: `Exactly. ${primaryConcept} is defined as: ${primaryConceptExpl}`,
      },
      {
        id: 'q3',
        question: `Consider the following scenario: ${firstExample.title}. How does ${subtopicTitle} apply?`,
        options: [
          firstExample.explanation,
          'The system ignores the scenario and proceeds without state validation',
          'All prior states are immediately corrupted and discarded',
          'The operation produces undefined behavior in standard environments',
        ],
        correctIndex: 0,
        category: 'application',
        explanation: `Right! As demonstrated in ${firstExample.title}: ${firstExample.explanation}`,
      },
      {
        id: 'q4',
        question: `How does ${subtopicTitle} resolve the common confusion: "${firstConfusion.confusion}"?`,
        options: [
          firstConfusion.clarification,
          'It treats both concepts as strictly identical with zero distinction',
          'It deletes the distinguishing parameters from the execution context',
          'It assumes the confusion has no impact on practical correctness',
        ],
        correctIndex: 0,
        category: 'differentiation',
        explanation: `Correct distinction! ${firstConfusion.clarification}`,
      },
      {
        id: 'q5',
        question: `Why does ${subtopicTitle} matter in practical system design?`,
        options: [
          whyExists,
          'It is an obsolete academic artifact with no practical usage',
          'It guarantees infinite performance regardless of hardware limits',
          'It eliminates all need for testing or verification',
        ],
        correctIndex: 0,
        category: 'application',
        explanation: `Key insight: ${whyExists}`,
      },
    ],
    externalResources: [
      {
        type: 'video',
        title: `Visual Guide to ${subtopicTitle}`,
        source: 'Educational Resource',
        description: `Visual walkthrough of ${subtopicTitle} mechanisms and examples`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subtopicTitle + ' ' + courseName)}`,
        tag: 'Video',
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// 6. Source-Grounded Cognitive Clarity Diagnostic Engine
// ---------------------------------------------------------------------------
export async function diagnoseSubtopicClarity(
  ai: GoogleGenAI | null,
  callGeminiFn: (ai: GoogleGenAI | null, prompt: string, opts?: any) => Promise<string | null>,
  params: {
    courseName?: string;
    topicTitle?: string;
    subtopicTitle: string;
    concepts?: string[];
    sourceReference?: string;
    questions: any[];
    userAnswers: Record<string, any>;
  }
): Promise<ClarityDiagnostic> {
  const { subtopicTitle, topicTitle, courseName, concepts = [], questions, userAnswers } = params;

  let correctCount = 0;
  const categoryTotals: Record<string, { total: number; correct: number }> = {
    conceptual: { total: 0, correct: 0 },
    recall: { total: 0, correct: 0 },
    application: { total: 0, correct: 0 },
    differentiation: { total: 0, correct: 0 },
  };

  const questionDetails = questions.map((q: any, i: number) => {
    const userSelected = userAnswers[q.id] ?? userAnswers[i];
    const isCorrect = userSelected === q.correctIndex;
    if (isCorrect) correctCount++;
    const cat = q.category || 'conceptual';
    if (categoryTotals[cat]) {
      categoryTotals[cat].total += 1;
      if (isCorrect) categoryTotals[cat].correct += 1;
    }
    return {
      question: q.question,
      options: q.options,
      userAnswer: q.options?.[userSelected] || 'None',
      correctAnswer: q.options?.[q.correctIndex] || 'None',
      isCorrect,
      category: cat,
      explanation: q.explanation,
    };
  });

  const getPct = (cat: string, fallback: number) => {
    const item = categoryTotals[cat];
    if (!item || item.total === 0) return fallback;
    return Math.round((item.correct / item.total) * 100);
  };

  const conceptualScore = getPct('conceptual', correctCount >= 4 ? 90 : 65);
  const recallScore = getPct('recall', correctCount >= 4 ? 85 : 60);
  const applicationScore = getPct('application', correctCount >= 4 ? 80 : 45);
  const differentiationScore = getPct('differentiation', correctCount >= 4 ? 75 : 40);
  const overallClarity = Math.round(
    0.30 * conceptualScore +
    0.20 * recallScore +
    0.30 * applicationScore +
    0.20 * differentiationScore
  );

  if (ai) {
    const prompt = `You are the KnowIQ Cognitive Clarity Diagnostic Engine.
Evaluate the student's performance specifically on Subtopic: "${subtopicTitle}".
Parent Topic: "${topicTitle || ''}"
Course: "${courseName || ''}"
Key Concepts: ${concepts.join(', ') || subtopicTitle}

STUDENT'S QUIZ RESULTS:
${JSON.stringify(questionDetails, null, 2)}

Overall Clarity Score: ${overallClarity}%
Category Breakdown:
- Conceptual: ${conceptualScore}%
- Recall: ${recallScore}%
- Application: ${applicationScore}%
- Differentiation: ${differentiationScore}%

CRITICAL PRINCIPLES (PRINCIPLES 19, 20, 36):
1. GROUNDED IN ${subtopicTitle}:
   - The diagnosis must diagnose the EXACT misconception about "${subtopicTitle}" and its concepts (${concepts.join(', ')}).
   - If the student made errors, pinpoint what specific conceptual distinction they confused (e.g., if learning Page Tables: "Confuses page number with frame number during address translation"; if learning Chain Rule: "Differentiates the outer function but forgets to multiply by the inner derivative").
   - NEVER generate generic feedback or refer to unrelated subjects.
2. REMEDIATION & FOLLOW-UP CHECK:
   - Provide a crystal-clear remediation explanation addressing the detected gap in "${subtopicTitle}".
   - Provide a follow-up multiple-choice question testing THAT EXACT CONCEPT in "${subtopicTitle}".

Output strictly valid JSON conforming to this schema:
{
  "detectedIssue": "Specific diagnostic diagnosis of the student's cognitive grasp or exact misconception in ${subtopicTitle}",
  "nextAction": "Prescribed adaptive action for reteaching or advancing in ${subtopicTitle}",
  "remediationContent": {
    "comparisonExplanation": "Targeted remediation explaining the key distinction or invariant in ${subtopicTitle}",
    "followUpQuestion": {
      "question": "Follow-up verification question testing the misunderstood concept in ${subtopicTitle}",
      "options": ["Option A (Correct)", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why Option A is correct based on ${subtopicTitle} principles"
    }
  }
}
Output strictly valid JSON.`;

    try {
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: 'application/json' });
      const parsed = safeJsonParse(raw);
      const validation = geminiDiagnoseClaritySchema.safeParse(parsed);
      if (validation.success) {
        return {
          overallClarity,
          conceptualScore,
          recallScore,
          applicationScore,
          differentiationScore,
          detectedIssue: validation.data.detectedIssue,
          nextAction: validation.data.nextAction || 'Review targeted remediation drill.',
          remediationContent: validation.data.remediationContent,
        };
      }
    } catch (err) {
      console.warn('[sourceEngine] Gemini diagnose error, falling back to deterministic diagnosis:', err);
    }
  }

  const primaryConcept = concepts[0] || subtopicTitle;
  let detectedIssue = '';
  let nextAction = '';

  if (overallClarity >= 80) {
    detectedIssue = `Excellent conceptual grasp of ${subtopicTitle}. The student accurately applied the core rules of ${primaryConcept} across both definitions and application scenarios.`;
    nextAction = `Promote ${subtopicTitle} to the Spaced Revision queue and unlock the next sequential learning unit.`;
  } else if (differentiationScore < 60) {
    detectedIssue = `Student understands the basic definition of ${subtopicTitle}, but struggles with differentiation and boundary conditions involving ${primaryConcept}.`;
    nextAction = `Reinforce with the targeted side-by-side distinction drill below, then verify retention.`;
  } else {
    detectedIssue = `Student experienced confusion on practical application scenarios in ${subtopicTitle}, particularly when evaluating complex states of ${primaryConcept}.`;
    nextAction = `Review the core invariant rules of ${primaryConcept} and execute the follow-up verification check.`;
  }

  return {
    overallClarity,
    conceptualScore,
    recallScore,
    applicationScore,
    differentiationScore,
    detectedIssue,
    nextAction,
    remediationContent: {
      comparisonExplanation: `Core distinction for ${subtopicTitle}: Invariants governing ${primaryConcept} must hold across all valid states. Ensure that preconditions are verified before executing transformations.`,
      followUpQuestion: {
        question: `In ${subtopicTitle}, what condition guarantees the invariant correctness of ${primaryConcept}?`,
        options: [
          `Satisfying verified boundary preconditions and adhering to formal ${subtopicTitle} rules`,
          `Allowing unconstrained state mutations without validation`,
          `Bypassing error checking during execution`,
          `Assuming that all inputs produce identical outputs regardless of context`,
        ],
        correctIndex: 0,
        explanation: `Preserving verified preconditions and following the formal rules of ${subtopicTitle} guarantees correctness for ${primaryConcept}.`,
      },
    },
  };
}
