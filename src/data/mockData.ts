import { Course, StudentState, SmartNotification, FacultyClass } from '../types';

export const initialCourses: Course[] = [
  {
    id: 'course-dbms',
    title: 'Database Management Systems (DBMS)',
    code: 'CS-302',
    durationDays: 30,
    description: 'Relational data models, ER diagrams, SQL query optimization, normal forms, transaction ACID properties, and concurrency control protocols.',
    studyMaterialsCount: 2,
    materialsNote: 'Uploaded: DBMS_Syllabus_2026.pdf, Korth_Ch1_to_8_Notes.pdf',
    createdAt: '2026-09-01',
    topics: [
      {
        id: 'top-1',
        title: 'Introduction to DBMS',
        order: 1,
        isCompleted: true,
        isLocked: false,
        subtopics: [
          {
            id: 'sub-1-1',
            title: 'File Systems vs DBMS',
            order: 1,
            isCompleted: true,
            isLocked: false,
            clarityScore: 92,
            lastRevisedDate: '2026-09-02',
            estimatedRetention: 88,
            daysUntilRevision: 7,
          },
          {
            id: 'sub-1-2',
            title: 'Three-Schema Architecture & Data Independence',
            order: 2,
            isCompleted: true,
            isLocked: false,
            clarityScore: 90,
            lastRevisedDate: '2026-09-03',
            estimatedRetention: 85,
            daysUntilRevision: 6,
          }
        ]
      },
      {
        id: 'top-2',
        title: 'Entity-Relationship (ER) Model',
        order: 2,
        isCompleted: true,
        isLocked: false,
        subtopics: [
          {
            id: 'sub-2-1',
            title: 'Entities, Attributes & Keys',
            order: 1,
            isCompleted: true,
            isLocked: false,
            clarityScore: 94,
            lastRevisedDate: '2026-09-04',
            estimatedRetention: 91,
            daysUntilRevision: 6,
          },
          {
            id: 'sub-2-2',
            title: 'Cardinality Ratios & Participation Constraints',
            order: 2,
            isCompleted: true,
            isLocked: false,
            clarityScore: 89,
            lastRevisedDate: '2026-09-05',
            estimatedRetention: 84,
            daysUntilRevision: 5,
          },
          {
            id: 'sub-2-3',
            title: 'Converting ER Diagrams to Relational Schemas',
            order: 3,
            isCompleted: true,
            isLocked: false,
            clarityScore: 87,
            lastRevisedDate: '2026-09-06',
            estimatedRetention: 82,
            daysUntilRevision: 4,
          }
        ]
      },
      {
        id: 'top-3',
        title: 'Relational Model & Relational Algebra',
        order: 3,
        isCompleted: false,
        isLocked: false,
        subtopics: [
          {
            id: 'sub-3-1',
            title: 'Relational Integrity Constraints & Keys',
            order: 1,
            isCompleted: true,
            isLocked: false,
            clarityScore: 86,
            lastRevisedDate: '2026-09-07',
            estimatedRetention: 78,
            daysUntilRevision: 3,
          },
          {
            id: 'sub-3-2',
            title: 'Relational Algebra (Select, Project, Cartesian Product)',
            order: 2,
            isCompleted: true,
            isLocked: false,
            clarityScore: 88,
            lastRevisedDate: '2026-09-08',
            estimatedRetention: 81,
            daysUntilRevision: 4,
          },
          {
            id: 'sub-3-3',
            title: 'SQL Joins (Inner, Left, Right, Full Outer & Natural)',
            order: 3,
            isCompleted: false,
            isLocked: false,
            clarityScore: 71,
            lastRevisedDate: '2026-09-07',
            estimatedRetention: 71,
            daysUntilRevision: 2,
            conceptual: {
              quick: 'SQL Joins merge tuples from two or more relations based on matching column values to query interrelated entities without duplication.',
              standard: 'A SQL Join combines columns from one or more tables in a relational database. It creates a set that can be saved as a table or used directly. An INNER JOIN returns only records where conditions match in both tables. Outer joins preserve unmatched rows from the left, right, or both sides with NULL placeholders.',
              deep: 'Under the engine hood, Joins are executed via Nested Loop Join (O(M*N) or index-assisted O(M log N)), Hash Join (builds in-memory hash table on the smaller relation, probes with larger relation), or Sort-Merge Join (efficient when both relations are indexed or sorted). Natural join assumes equal column names and eliminates duplicate columns automatically.',
              expert: 'Formal relational algebra equivalence: R ⋈_θ S = σ_θ (R × S). Cost-based optimizers utilize dynamic programming (System-R style) or volcano/cascades frameworks to enumerate left-deep vs bushy tree plans, evaluating cardinality estimates and I/O page fetches.',
              whatIsIt: 'A mechanism to query and combine attributes from distributed relational tables using foreign-key references.',
              whyExists: 'Because normalization splits data across multiple dedicated tables to prevent redundancy, joins are necessary to reassemble composite records at query time.',
              problemSolved: 'Eliminates data duplication while maintaining the ability to produce unified relational views.',
              keyTakeaway: 'Inner joins filter for intersection; Outer joins preserve domain entities even without matching foreign records.'
            },
            interactive: {
              fillBlank: {
                question: 'Complete the Join definition:',
                preText: 'An',
                missingWord: 'INNER JOIN',
                postText: 'returns only rows when there is a match in both the left and right tables.',
                options: ['INNER JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'SEMI JOIN'],
                hint: 'It filters strictly for the intersection of keys.',
                explanation: 'INNER JOIN discards unmatched rows from both tables, producing only intersection tuples.'
              },
              matching: [
                { id: 'm1', term: 'INNER JOIN', definition: 'Returns only records with matching keys in both tables' },
                { id: 'm2', term: 'LEFT OUTER JOIN', definition: 'Returns all rows from left table plus matching rows from right' },
                { id: 'm3', term: 'FULL OUTER JOIN', definition: 'Returns all rows when there is a match in either left or right' },
                { id: 'm4', term: 'CROSS JOIN', definition: 'Computes Cartesian product of two tables (all possible combinations)' }
              ],
              ordering: {
                title: 'SQL Query Execution Sequence',
                instruction: 'Order the SQL processing stages in logical engine execution order:',
                items: [
                  { id: 'o1', text: 'FROM / JOIN table data evaluation', correctOrder: 1 },
                  { id: 'o2', text: 'WHERE row-level filtering', correctOrder: 2 },
                  { id: 'o3', text: 'GROUP BY aggregation clustering', correctOrder: 3 },
                  { id: 'o4', text: 'HAVING aggregate-level filtering', correctOrder: 4 },
                  { id: 'o5', text: 'SELECT projection & ORDER BY sorting', correctOrder: 5 }
                ]
              }
            },
            deepRevision: {
              detailedNotes: [
                'INNER JOIN is commutative and associative in relational algebra, allowing the query optimizer to reorder join trees.',
                'Hash Joins require sufficient RAM to hold the hash table of the inner relation; otherwise, graceful hash join spills partitions to disk.',
                'Beware of NULL comparisons: `NULL = NULL` evaluates to UNKNOWN in three-valued logic, so rows with NULL foreign keys are excluded by inner joins.'
              ],
              comparisonTable: {
                title: 'Join Types Comparison Matrix',
                headers: ['Join Type', 'Matched Rows', 'Unmatched Left', 'Unmatched Right', 'Typical SQL Keyword'],
                rows: [
                  ['Inner Join', 'Included', 'Excluded', 'Excluded', 'INNER JOIN / JOIN'],
                  ['Left Outer', 'Included', 'Included (NULL padded)', 'Excluded', 'LEFT JOIN'],
                  ['Right Outer', 'Included', 'Excluded', 'Included (NULL padded)', 'RIGHT JOIN'],
                  ['Full Outer', 'Included', 'Included (NULL padded)', 'Included (NULL padded)', 'FULL OUTER JOIN']
                ]
              },
              commonPitfalls: [
                'Using WHERE instead of ON in LEFT JOIN conditions which accidentally turns an outer join into an inner join by filtering out NULLs.',
                'Forgetting indexes on foreign key join columns, degrading query performance from O(N) to O(N²).'
              ],
              mentalModelOrMnemonic: 'Mnemonic: "IN is intersection, OUT preserves the boundary."'
            },
            hardQuiz: [
              {
                id: 'q1',
                question: 'Table A has 10 rows with 3 matching Table B, and Table B has 8 rows. How many rows will a FULL OUTER JOIN produce if 4 rows in B have no match in A?',
                options: ['10 + 4 = 14 rows', '10 + 8 = 18 rows', '3 rows', '15 rows'],
                correctIndex: 0,
                category: 'application',
                explanation: 'A has 10 rows (3 matched + 7 unmatched). B has 8 rows (3 matched + 4 unmatched + 1 not accounted or total 7 unmatched left + 4 unmatched right + 3 matched = 14 rows).'
              },
              {
                id: 'q2',
                question: 'What happens if a query uses `LEFT JOIN B ON A.id = B.id WHERE B.status = "ACTIVE"` when B has unmatched rows?',
                options: [
                  'It silently converts into an INNER JOIN because WHERE B.status evaluates to UNKNOWN/False for unmatched NULL rows.',
                  'It preserves all unmatched rows from Table A with default values.',
                  'The database throws a syntax error.',
                  'It automatically converts to a RIGHT JOIN.'
                ],
                correctIndex: 0,
                category: 'differentiation',
                explanation: 'Putting a filter on the right table in the WHERE clause eliminates rows where B is NULL, effectively negating the outer join.'
              },
              {
                id: 'q3',
                question: 'Which join algorithm is optimal when both joining tables are pre-sorted and indexed on the join key?',
                options: ['Sort-Merge Join', 'Nested Loop Join with Table Scan', 'Block Hash Join', 'Broadcast Cartesian Join'],
                correctIndex: 0,
                category: 'recall',
                explanation: 'Sort-Merge Join runs in linear O(M + N) time without needing an in-memory hash table when inputs are already sorted on the join key.'
              },
              {
                id: 'q4',
                question: 'In relational algebra, what is the exact semantic equivalent of the Natural Join (R ⋈ S)?',
                options: [
                  'Projection π of equijoin on common attributes, removing duplicate join columns',
                  'Cartesian product R × S without selection',
                  'Selection σ on distinct attributes only',
                  'Union of R and S'
                ],
                correctIndex: 0,
                category: 'conceptual',
                explanation: 'Natural join first performs equijoin on attributes with identical names and then projects out the duplicate attribute columns.'
              },
              {
                id: 'q5',
                question: 'If relations R(A, B) and S(B, C) have schema (A, B) and (B, C), and R has 100 rows and S has 0 rows, how many rows are in R LEFT JOIN S?',
                options: ['100 rows (all with C as NULL)', '0 rows', '100 rows (with C as 0)', 'An error occurs'],
                correctIndex: 0,
                category: 'application',
                explanation: 'LEFT JOIN preserves every single row from the left table R (100 rows), appending NULL for all attributes from table S.'
              }
            ],
            externalResources: [
              {
                type: 'video',
                title: 'Visualizing SQL Joins with Venn and Hash Plan Diagrams',
                source: 'Database Systems Series (YouTube)',
                description: 'Clear step-by-step visual animation of Hash vs Merge Join query plans.',
                url: 'https://www.youtube.com/results?search_query=sql+joins+explained+visually',
                tag: 'Recommended for execution plan intuition'
              },
              {
                type: 'article',
                title: 'SQL Join Optimization & Three-Valued Logic Pitfalls',
                source: 'Modern Database Journal',
                description: 'Deep dive into why WHERE clauses break LEFT JOINs and how optimizer handles cardinality.',
                url: 'https://en.wikipedia.org/wiki/Join_(SQL)',
                tag: 'Deep conceptual clarification'
              },
              {
                type: 'reference',
                title: 'PostgreSQL Documentation: Table Expressions and Joins',
                source: 'PostgreSQL Official Docs',
                description: 'Canonical syntax, semantics, and LATERAL join behavior.',
                url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
                tag: 'Standard Reference'
              }
            ]
          }
        ]
      },
      {
        id: 'top-4',
        title: 'Normalization & Functional Dependencies',
        order: 4,
        isCompleted: false,
        isLocked: false,
        subtopics: [
          {
            id: 'sub-4-1',
            title: 'First Normal Form (1NF) & Second Normal Form (2NF)',
            order: 1,
            isCompleted: true,
            isLocked: false,
            clarityScore: 82,
            lastRevisedDate: '2026-09-05',
            estimatedRetention: 74,
            daysUntilRevision: 3,
          },
          {
            id: 'sub-4-2',
            title: 'Third Normal Form (3NF) & Transitive Dependencies',
            order: 2,
            isCompleted: false,
            isLocked: false,
            clarityScore: 46,
            lastRevisedDate: '2026-09-02',
            estimatedRetention: 46,
            daysUntilRevision: 0,
            conceptual: {
              quick: '3NF removes transitive dependencies. Every non-prime attribute must depend directly on the candidate key, and nothing but the candidate key!',
              standard: 'A relation is in Third Normal Form (3NF) if it is in 2NF and no non-prime attribute is transitively dependent on any candidate key. Formally, for every non-trivial functional dependency X → Y, either X is a superkey OR Y is a prime attribute (part of a candidate key).',
              deep: '3NF guarantees lossless-join decomposition and dependency preservation. While Boyce-Codd Normal Form (BCNF) strictly requires X to be a superkey (eliminating all functional dependency anomalies), BCNF does not always preserve dependencies. 3NF strikes a deliberate engineering compromise by permitting prime attributes on the right side (Y), thus ensuring all dependencies are verifiable without joining tables.',
              expert: 'Formal definition: Given relation schema R and set of FDs F, R is in 3NF iff for every non-trivial FD X → Y in F⁺: 1) X ⊇ Y is trivial, OR 2) X is a superkey of R, OR 3) Each attribute in (Y - X) is a prime attribute. 3NF synthesis algorithm (Bernstein) constructs a minimal cover in polynomial time O(|F|²) ensuring both lossless join and dependency preservation.',
              whatIsIt: 'A database design standard ensuring that columns depend only on primary/candidate keys, eliminating secondary chain dependencies.',
              whyExists: 'To eliminate update, insertion, and deletion anomalies caused by indirect (transitive) relationships.',
              problemSolved: 'Prevents redundant duplication of facts. If an employee belongs to Department D01 with DepartmentName "Engineering", storing DepartmentName in the Employee table creates anomalies if the department changes its name.',
              keyTakeaway: '"The key, the whole key (2NF), and nothing but the key (3NF), so help me Codd."'
            },
            interactive: {
              fillBlank: {
                question: 'Complete the 3NF condition:',
                preText: 'In 3NF, for every non-trivial dependency X → Y, either X is a superkey OR Y is a',
                missingWord: 'prime attribute',
                postText: '(a member of a candidate key).',
                options: ['prime attribute', 'foreign key', 'composite attribute', 'nullable column'],
                hint: 'It refers to an attribute that forms part of any candidate key.',
                explanation: 'In 3NF, having Y as a prime attribute is what distinguishes 3NF from the stricter BCNF.'
              },
              matching: [
                { id: 'm1', term: 'Functional Dependency (X → Y)', definition: 'Value of attribute X uniquely determines the value of attribute Y' },
                { id: 'm2', term: 'Transitive Dependency (X → Y → Z)', definition: 'Non-key attribute Z depends on non-key attribute Y which depends on candidate key X' },
                { id: 'm3', term: '3NF Condition', definition: 'Relation is in 2NF and contains zero transitive dependencies for non-prime attributes' },
                { id: 'm4', term: 'Partial Dependency', definition: 'Non-prime attribute depends on only a proper subset of a composite candidate key (violates 2NF)' }
              ],
              ordering: {
                title: 'Normalization Progression',
                instruction: 'Order the normal forms in sequence from baseline to highest strictness:',
                items: [
                  { id: 'o1', text: '1NF: Eliminate repeating groups & enforce atomic values', correctOrder: 1 },
                  { id: 'o2', text: '2NF: Eliminate partial dependencies on composite keys', correctOrder: 2 },
                  { id: 'o3', text: '3NF: Eliminate transitive dependencies on non-key columns', correctOrder: 3 },
                  { id: 'o4', text: 'BCNF: Enforce that every determinant must be a superkey', correctOrder: 4 }
                ]
              }
            },
            deepRevision: {
              detailedNotes: [
                'Rule of thumb: 2NF checks for parts of composite keys (Partial dependency). 3NF checks for dependencies between non-keys (Transitive dependency).',
                'If a relation has only simple candidate keys (single-attribute keys), it is automatically in 2NF! You only need to verify 3NF.',
                'BCNF is strictly stronger than 3NF. If a relation is in BCNF, it is guaranteed to be in 3NF.',
                'The classic trade-off: 3NF always guarantees dependency preservation; BCNF may require cross-table assertions to preserve certain dependencies.'
              ],
              comparisonTable: {
                title: '2NF vs 3NF vs BCNF Comparison',
                headers: ['Normal Form', 'Eliminates', 'Allowed Condition for X → Y', 'Preserves Dependencies?'],
                rows: [
                  ['2NF', 'Partial dependencies', 'No proper subset of candidate key determines non-prime', 'Always'],
                  ['3NF', 'Transitive dependencies', 'X is superkey OR Y is prime attribute', 'Always'],
                  ['BCNF', 'All FD redundancy', 'X must be a superkey (no exceptions)', 'Not always']
                ]
              },
              commonPitfalls: [
                'Confusing 2NF and 3NF: Forgetting that partial dependency requires a COMPOSITE key, whereas transitive dependency can happen with a single primary key!',
                'Thinking that all 3NF relations are anomaly-free. (BCNF relations fix remaining anomalies when multiple overlapping candidate keys exist).'
              ],
              mentalModelOrMnemonic: 'Mnemonic: "Every non-key attribute must provide a fact about the key (1NF), the WHOLE key (2NF), and NOTHING BUT the key (3NF)."'
            },
            hardQuiz: [
              {
                id: 'q1',
                question: 'Consider relation R(A, B, C, D) with candidate key {A}. Functional dependencies are: A → B, B → C, and C → D. What normal form does R violate, and why?',
                options: [
                  'Violates 3NF because non-prime attributes C and D depend on non-prime attribute B (transitive dependency)',
                  'Violates 2NF because of partial dependency on key A',
                  'Violates 1NF because attributes are multi-valued',
                  'It is already in BCNF because A is a candidate key'
                ],
                correctIndex: 0,
                category: 'differentiation',
                explanation: 'Since key is simple {A}, partial dependency is impossible (so it is in 2NF). But B → C involves non-prime determining non-prime, which is a transitive dependency violating 3NF.'
              },
              {
                id: 'q2',
                question: 'In relation R(A, B, C) where candidate keys are {A, B} and {B, C}. Dependency is C → A. Is R in 3NF? Why or why not?',
                options: [
                  'Yes, it is in 3NF because A is a prime attribute (part of candidate key {A, B}), even though C is not a superkey.',
                  'No, because C is not a superkey and every dependency must have a superkey on the left.',
                  'No, it violates 2NF because of partial dependency.',
                  'No, prime attributes cannot appear on the right side of any dependency.'
                ],
                correctIndex: 0,
                category: 'conceptual',
                explanation: 'In 3NF, X → Y is allowed if X is a superkey OR Y is a prime attribute. Here A is part of candidate key {A, B}, so it satisfies 3NF (though it violates BCNF).'
              },
              {
                id: 'q3',
                question: 'A database architect needs to guarantee that every functional dependency can be verified locally within decomposed tables without expensive multi-table joins. Which normal form must they choose?',
                options: [
                  '3NF, because 3NF synthesis always guarantees dependency preservation along with lossless join.',
                  'BCNF, because BCNF is strictly higher and therefore preserves more dependencies.',
                  '4NF, because multi-valued dependencies encompass functional dependencies.',
                  'Un-normalized flat schema.'
                ],
                correctIndex: 0,
                category: 'recall',
                explanation: '3NF is famous for guaranteeing dependency preservation. BCNF cannot always preserve all functional dependencies upon lossless decomposition.'
              },
              {
                id: 'q4',
                question: 'Relation StudentCourse(StudentID, CourseID, Department, DeptOffice). Primary Key is {StudentID, CourseID}. FDs are: {StudentID, CourseID} → Department, and Department → DeptOffice. What is DeptOffice?',
                options: [
                  'Transitively dependent on {StudentID, CourseID} via Department (violating 3NF)',
                  'Partially dependent on StudentID (violating 2NF)',
                  'A prime attribute forming the superkey',
                  'A multi-valued attribute requiring 4NF'
                ],
                correctIndex: 0,
                category: 'application',
                explanation: 'DeptOffice is a non-prime attribute depending on another non-prime attribute (Department), which in turn depends on the candidate key. This is the textbook definition of a transitive dependency.'
              },
              {
                id: 'q5',
                question: 'Which of the following conditions is strictly sufficient to prove that a relation is in 2NF without checking functional dependencies?',
                options: [
                  'Every candidate key consists of exactly one single attribute (no composite keys)',
                  'The relation contains more than 5 attributes',
                  'All attributes are numeric types',
                  'The relation has no foreign keys'
                ],
                correctIndex: 0,
                category: 'differentiation',
                explanation: 'Partial dependency requires a non-prime attribute to depend on a PROPER SUBSET of a composite candidate key. If candidate keys are single attributes, no proper non-empty subset exists!'
              }
            ],
            externalResources: [
              {
                type: 'video',
                title: 'Database Normalization: 1NF, 2NF, 3NF & BCNF with Real Tables',
                source: 'Computer Science Hub (YouTube)',
                description: 'Clear visual demonstration with animated anomalies and table decomposition.',
                url: 'https://www.youtube.com/results?search_query=third+normal+form+3nf+explained',
                tag: 'Recommended for visual learners'
              },
              {
                type: 'article',
                title: 'Why 3NF vs BCNF Matters in High-Concurrency Systems',
                source: 'High Performance Database Architecture',
                description: 'Practical guide on balancing update performance, redundancy, and join overhead.',
                url: 'https://en.wikipedia.org/wiki/Third_normal_form',
                tag: 'Deep architectural perspective'
              },
              {
                type: 'reference',
                title: 'Bernstein Synthesis Algorithm for 3NF Decomposition',
                source: 'Stanford CS Database Course Notes',
                description: 'Algorithmic proof of minimal covers and dependency-preserving 3NF synthesis.',
                url: 'https://web.stanford.edu/class/cs145/',
                tag: 'Formal Theory Reference'
              }
            ]
          },
          {
            id: 'sub-4-3',
            title: 'Boyce-Codd Normal Form (BCNF) & Decomposition Anomalies',
            order: 3,
            isCompleted: false,
            isLocked: true,
            clarityScore: 0,
            estimatedRetention: 0,
          }
        ]
      },
      {
        id: 'top-5',
        title: 'Transactions & Concurrency Control',
        order: 5,
        isCompleted: false,
        isLocked: true,
        subtopics: [
          {
            id: 'sub-5-1',
            title: 'ACID Properties & Transaction States',
            order: 1,
            isCompleted: false,
            isLocked: true,
          },
          {
            id: 'sub-5-2',
            title: 'Schedules, Serializability (Conflict & View)',
            order: 2,
            isCompleted: false,
            isLocked: true,
          },
          {
            id: 'sub-5-3',
            title: 'Locking Protocols (2PL, Strict 2PL) & Deadlocks',
            order: 3,
            isCompleted: false,
            isLocked: true,
          }
        ]
      }
    ]
  }
];

export const initialStudentState: StudentState = {
  xp: 1240,
  streakDays: 7,
  streakHistory: [
    { day: 'Mon', date: '2026-09-03', completed: true },
    { day: 'Tue', date: '2026-09-04', completed: true },
    { day: 'Wed', date: '2026-09-05', completed: true },
    { day: 'Thu', date: '2026-09-06', completed: true },
    { day: 'Fri', date: '2026-09-07', completed: true },
    { day: 'Sat', date: '2026-09-08', completed: true },
    { day: 'Sun', date: '2026-09-09', completed: true }
  ],
  todayProgress: {
    completed: 3,
    target: 5
  },
  badges: [
    {
      id: 'b1',
      title: 'First Step',
      description: 'Completed your first subtopic in the adaptive learning path',
      icon: 'Footprints',
      unlocked: true,
      unlockedAt: '2026-09-02',
      rarity: 'common'
    },
    {
      id: 'b2',
      title: '7-Day Learner',
      description: 'Maintained a consecutive 7-day active study streak',
      icon: 'Flame',
      unlocked: true,
      unlockedAt: '2026-09-09',
      rarity: 'rare'
    },
    {
      id: 'b3',
      title: 'Deep Thinker',
      description: 'Completed 10 deep-learning explanation sessions',
      icon: 'Brain',
      unlocked: true,
      unlockedAt: '2026-09-08',
      rarity: 'rare'
    },
    {
      id: 'b4',
      title: 'Clarity Master',
      description: 'Achieved >85% clarity score across 5 academic topics',
      icon: 'Sparkles',
      unlocked: true,
      unlockedAt: '2026-09-07',
      rarity: 'epic'
    },
    {
      id: 'b5',
      title: 'Quiz Champion',
      description: 'Aced a 5-question hard quiz with 100% correct answers',
      icon: 'Award',
      unlocked: false,
      rarity: 'epic'
    },
    {
      id: 'b6',
      title: 'Consistent Scholar',
      description: 'Studied for 30 days and completed a full course curriculum',
      icon: 'Trophy',
      unlocked: false,
      rarity: 'legendary'
    }
  ]
};

export const initialNotifications: SmartNotification[] = [
  {
    id: 'notif-1',
    timeOfDay: 'morning',
    title: '🌅 Your learning path is ready',
    message: "Today's target: 2 subtopics in Relational Model & Normalization to keep your 7-day streak alive.",
    actionText: 'Resume Path',
    topicId: 'top-3',
    subtopicId: 'sub-3-3',
    isRead: false,
    timestamp: 'Today, 8:15 AM'
  },
  {
    id: 'notif-2',
    timeOfDay: 'afternoon',
    title: '🧠 Normalization clarity check',
    message: "You haven't completed 3NF yet. Dive into the 4-step clarity loop (15 mins).",
    actionText: 'Start 3NF',
    topicId: 'top-4',
    subtopicId: 'sub-4-2',
    isRead: false,
    timestamp: 'Today, 2:30 PM'
  },
  {
    id: 'notif-3',
    timeOfDay: 'evening',
    title: '🔄 Spaced Revision Due',
    message: 'Normalization estimated retention is down to 46%. Quick recall session recommended!',
    actionText: 'Review Now',
    topicId: 'top-4',
    subtopicId: 'sub-4-2',
    isRead: false,
    timestamp: 'Today, 6:45 PM'
  }
];

export const initialFacultyClasses: FacultyClass[] = [
  {
    id: 'class-cse-3a',
    name: 'B.Tech CSE - Section A',
    code: 'DBMS-CSE301',
    semester: 'Fall 2026',
    studentCount: 48,
    averageClarity: 78,
    overallProgress: 64,
    students: [
      {
        id: 'st-1',
        name: 'Aarav Sharma',
        email: 'aarav.sharma@univ.edu',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        progressPercent: 72,
        averageClarity: 86,
        streak: 7,
        lastActive: '10m ago',
        weakTopic: 'Transitive Dependencies'
      },
      {
        id: 'st-2',
        name: 'Priya Nair',
        email: 'priya.nair@univ.edu',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        progressPercent: 80,
        averageClarity: 92,
        streak: 12,
        lastActive: '1h ago',
        weakTopic: 'View Serializability'
      },
      {
        id: 'st-3',
        name: 'Rohan Mehta',
        email: 'rohan.mehta@univ.edu',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        progressPercent: 45,
        averageClarity: 62,
        streak: 2,
        lastActive: 'Yesterday',
        weakTopic: '3NF vs 2NF differentiation'
      },
      {
        id: 'st-4',
        name: 'Ananya Iyer',
        email: 'ananya.iyer@univ.edu',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
        progressPercent: 88,
        averageClarity: 94,
        streak: 15,
        lastActive: '30m ago',
        weakTopic: 'Multi-valued Dependencies'
      },
      {
        id: 'st-5',
        name: 'Vikram Patel',
        email: 'vikram.patel@univ.edu',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        progressPercent: 55,
        averageClarity: 68,
        streak: 4,
        lastActive: '3h ago',
        weakTopic: 'SQL Outer Joins with WHERE'
      }
    ],
    weakTopics: [
      {
        topic: '3NF vs 2NF Partial vs Transitive Distinction',
        clarity: 48,
        issue: '62% of students confuse composite-key partial dependency with non-prime transitive chain.',
        affectedStudentsCount: 30
      },
      {
        topic: 'SQL Outer Join condition in WHERE vs ON',
        clarity: 54,
        issue: 'Students inadvertently nullify outer joins by applying right-table predicates in WHERE clause.',
        affectedStudentsCount: 22
      },
      {
        topic: 'Conflict Serializability Precedence Graph Cycles',
        clarity: 58,
        issue: 'Struggling to draw correct directed edges for write-read vs write-write conflicts.',
        affectedStudentsCount: 19
      }
    ],
    topicProgress: [
      { topic: '1. Intro to DBMS', completedPercent: 96, averageClarity: 91 },
      { topic: '2. ER Modeling', completedPercent: 90, averageClarity: 88 },
      { topic: '3. Relational Model & SQL', completedPercent: 74, averageClarity: 79 },
      { topic: '4. Normalization', completedPercent: 42, averageClarity: 64 },
      { topic: '5. Transactions & Concurrency', completedPercent: 18, averageClarity: 59 }
    ]
  }
];
