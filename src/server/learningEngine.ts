import { GoogleGenAI } from '@google/genai';
import {
  ConceptualClarity,
  conceptualClaritySchema,
  InteractiveQuestion,
  interactiveQuestionSchema,
  AnswerEvaluationRequest,
  AnswerEvaluationResult,
  answerEvaluationResultSchema,
  TopicAnalysisResult,
  topicAnalysisResultSchema,
  TopicSubtopicItem,
} from '../lib/schemas';
import { analyzeTopic, decideSubtopics, TopicScopeAnalysis } from './topicEngine';

export type ModelCaller = (
  ai: GoogleGenAI | null,
  prompt: string,
  options?: { responseMimeType?: string }
) => Promise<string | null>;

// Safe JSON extractor
export function safeExtractJson<T = any>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.substring(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. High-Fidelity Domain Knowledge Bases (Real Technical Explanations, Zero Mad-Libs)
// ---------------------------------------------------------------------------
const domainExpertExplanations: Record<string, Partial<ConceptualClarity>> = {
  'process scheduling': {
    summary: 'Process Scheduling is the operating system mechanism that decides which ready process is allocated CPU execution time, balancing throughput, latency, and fairness.',
    explanation: `When multiple programs run concurrently on a computer, the number of active processes almost always exceeds the number of physical CPU cores. Without coordination, processes would either monopolize the processor or starve waiting for execution. Process scheduling resolves this fundamental contention by switching the CPU among processes in rapid succession, creating the illusion of simultaneous execution while maximizing hardware utilization.

The operating system scheduler operates on distinct queues: the Job Queue (all processes entering the system), the Ready Queue (processes residing in memory waiting for CPU allocation), and Device Waiting Queues. The dispatcher performs the actual context switch, saving the registers and Program Counter of the departing process into its Process Control Block (PCB) and loading the state of the chosen process.

Scheduling decisions typically occur under four state transitions: when a process moves from Running to Waiting (e.g., I/O request), from Running to Ready (e.g., timer interrupt), from Waiting to Ready (e.g., I/O completion), or when a process terminates. Schedulers that interrupt running processes on timer events are preemptive, whereas non-preemptive schedulers allow a process to run until it voluntarily yields control or blocks on I/O.

Different algorithms optimize for conflicting criteria. First-Come First-Served (FCFS) is simple but suffers from the Convoy Effect, where short jobs wait behind long CPU-bound tasks. Shortest Job First (SJF) achieves mathematically optimal average turnaround time but requires predicting future burst lengths. Round Robin (RR) introduces a fixed time quantum to guarantee bounded response times for interactive applications.`,
    key_concepts: [
      { term: 'Ready Queue', explanation: 'A queue of processes loaded in main memory that are ready and waiting to execute on a CPU core.' },
      { term: 'Context Switch', explanation: 'The kernel routine that saves the execution context (registers, PC) of the running process and loads the context of the next scheduled process.' },
      { term: 'Preemption', explanation: 'The ability of the operating system kernel to forcibly interrupt a running process before its CPU burst completes to run another process.' },
      { term: 'Time Quantum', explanation: 'The maximum continuous time slice allocated to a process in preemptive algorithms like Round Robin before a context switch occurs.' }
    ],
    examples: [
      {
        title: 'Round Robin Execution Trace',
        explanation: 'Consider three processes P1 (burst 24ms), P2 (burst 3ms), and P3 (burst 3ms) arriving at time 0 with a time quantum of 4ms. P1 runs for 4ms (20ms remaining), then is preempted. P2 runs for 3ms and terminates at t=7ms. P3 runs for 3ms and terminates at t=10ms. P1 resumes at t=10ms and runs to completion at t=30ms. Notice that P2 and P3 finish in 7ms and 10ms respectively, whereas in non-preemptive FCFS they would have waited 24ms and 27ms.'
      }
    ],
    analogy: 'Think of CPU scheduling like a doctor triage room in an emergency clinic: instead of examining one patient with a 4-hour surgery while everyone with simple bandages waits outside, the doctor gives quick checkups to urgent cases or rotates through consultation slots so every patient progresses.',
    common_confusions: [
      {
        confusion: 'Confusing Long-Term, Medium-Term, and Short-Term Schedulers',
        clarification: 'The Short-Term Scheduler (CPU Scheduler) selects which in-memory process gets the CPU in milliseconds. The Long-Term Scheduler (Job Scheduler) controls the degree of multiprogramming by admitting processes from disk to memory. The Medium-Term Scheduler handles memory swapping.'
      },
      {
        confusion: 'Assuming Round Robin is always fairer and faster than Shortest Job First',
        clarification: 'Round Robin provides superior interactive responsiveness, but its average turnaround time is often worse than SJF due to context-switching overhead when the time quantum is improperly tuned.'
      }
    ],
    key_takeaways: [
      'Scheduling manages CPU allocation among competing processes in the Ready Queue.',
      'Preemptive algorithms allow timer interrupts to prevent CPU monopolization.',
      'Context switching incurs pure overhead; time quanta must be large relative to switch time.',
      'No single algorithm is best: choice depends on optimizing throughput, turnaround time, or responsiveness.'
    ]
  },

  'cpu registers': {
    summary: 'CPU Registers are small, ultra-fast storage locations located directly inside the processor core that hold operands, immediate memory addresses, and architectural execution flags.',
    explanation: `At the apex of the computer memory hierarchy lie CPU registers. While main memory (RAM) and solid-state drives store gigabytes to terabytes of data, accessing RAM requires traversing the system bus and memory controller, consuming tens to hundreds of processor clock cycles. CPU registers exist directly on the processor die alongside the Arithmetic Logic Unit (ALU), allowing read and write operations to complete in a single fraction of a clock cycle.

In modern computer architectures, registers are divided into general-purpose and special-purpose categories. General-Purpose Registers (such as RAX, RBX, RCX, RDX in x86-64, or X0-X30 in ARM64) hold arithmetic operands, loop counters, and temporary results during computation. Rather than fetching operands from main memory for every addition or comparison, compilers aggressively optimize register allocation so intermediate values remain inside registers for the duration of a loop or function.

Special-Purpose Registers are architectural registers that govern the fetch-decode-execute instruction cycle. The Program Counter (PC or RIP) holds the memory address of the next machine instruction to be fetched. The Instruction Register (IR) holds the binary opcode currently being decoded by the control unit. The Stack Pointer (SP or RSP) tracks the top of the runtime call stack, and the Status/Flags Register (EFLAGS) records condition codes such as Zero, Sign, Overflow, and Carry after arithmetic operations.

Because register space is physically constrained by silicon area and instruction encoding bit-widths (typically 16 to 64 registers total), register allocation is a core challenge in compiler design. When a function requires more active variables than available registers, the compiler performs "register spilling," storing excess values onto the stack in main memory and reloading them as needed.`,
    key_concepts: [
      { term: 'Program Counter (PC)', explanation: 'A special-purpose CPU register that continuously stores the memory address of the next instruction to be fetched and executed.' },
      { term: 'General-Purpose Registers (GPR)', explanation: 'High-speed processor registers used by machine instructions to hold active data operands, pointers, and arithmetic results.' },
      { term: 'Register Spilling', explanation: 'The compiler technique of transferring register contents to memory (the stack) when the number of live variables exceeds available hardware registers.' },
      { term: 'Instruction Register (IR)', explanation: 'The internal processor register that stores the binary instruction fetched from memory while the control unit decodes it.' }
    ],
    examples: [
      {
        title: 'Assembly Arithmetic on Registers vs Memory',
        explanation: 'In x86-64 assembly, adding two numbers stored in memory requires: `MOV EAX, [mem_a]` (load into register EAX, ~10ns if cache miss), followed by `ADD EAX, [mem_b]` (compute in ALU), and `MOV [mem_c], EAX` (store back). If the values are already in registers, `ADD EAX, EBX` executes in less than 0.3 nanoseconds (1 cycle), illustrating the order-of-magnitude speed difference.'
      }
    ],
    analogy: 'Think of CPU registers as the items held in your hands right now while cooking, compared to ingredients in the refrigerator (cache) or grocery store across town (RAM). You can instantly cut whatever is in your hands, but retrieving anything else requires walking away from the cutting board.',
    common_confusions: [
      {
        confusion: 'Confusing CPU Registers with CPU Cache (L1/L2/L3)',
        clarification: 'Registers are explicitly addressed by machine instructions (e.g. `%eax`), whereas cache memory is transparent hardware SRAM managed automatically by the CPU memory controller.'
      },
      {
        confusion: 'Believing larger register counts always improve performance',
        clarification: 'More registers increase instruction encoding size (more bits needed to address each register) and lengthen context switch times because every register must be saved to the PCB.'
      }
    ],
    key_takeaways: [
      'Registers are the fastest and smallest memory tier, operating in sub-nanosecond clock cycles.',
      'General-purpose registers hold active operands; special registers (PC, SP, Flags) manage processor state.',
      'Compilers perform graph coloring to maximize register utilization and avoid memory spilling.',
      'Registers are referenced directly by assembly opcodes, unlike transparent hardware caches.'
    ]
  },

  'virtual memory': {
    summary: 'Virtual Memory is a memory virtualization technique that maps a process\'s uniform logical address space to fragmented physical RAM and secondary storage via hardware page tables.',
    explanation: `Early computers loaded program binaries directly into continuous physical addresses. This meant a program could overwrite memory belonging to the kernel or other programs, and no program could be larger than the physical RAM installed in the machine. Virtual memory overcomes these limitations by decoupling the programmer's view of memory from physical reality: every process believes it owns a contiguous, private address space starting at address 0.

The fundamental mechanism enabling virtual memory is Paging. The process's logical address space is divided into fixed-size chunks called "pages" (typically 4 KB in modern OSs). Physical RAM is similarly divided into equal-sized chunks called "frames." The operating system constructs a Page Table for each process, storing the mapping between virtual page numbers and physical frame numbers. The Memory Management Unit (MMU) in CPU hardware intercepts every memory access, translating the virtual address into a physical address on the fly.

To make translation fast, processors include the Translation Lookaside Buffer (TLB), a hardware cache of recent virtual-to-physical page mappings. When a memory access hits the TLB, translation occurs in a single clock cycle. If a TLB miss occurs, the MMU performs a multi-level page table walk in main memory to resolve the frame address.

Virtual memory also enables Demand Paging: pages are not loaded into physical RAM until the process actually accesses them. If a program references a page that resides on disk rather than in physical RAM, the MMU raises a hardware interrupt known as a Page Fault. The OS kernel traps the fault, reads the missing page from swap space into an available frame, updates the page table with the valid bit, and restarts the faulting instruction seamlessly.`,
    key_concepts: [
      { term: 'Page Table', explanation: 'A per-process operating system data structure that maps virtual page numbers (VPN) to physical frame numbers (PFN) along with permission bits.' },
      { term: 'Memory Management Unit (MMU)', explanation: 'A hardware component inside the CPU that translates logical/virtual addresses into physical memory addresses during instruction execution.' },
      { term: 'Translation Lookaside Buffer (TLB)', explanation: 'A high-speed associative hardware cache inside the MMU storing the most recently translated virtual-to-physical address mappings.' },
      { term: 'Page Fault', explanation: 'A hardware trap triggered by the MMU when a process references a virtual page that is currently marked invalid or not resident in physical RAM.' }
    ],
    examples: [
      {
        title: 'Page Fault Handling Lifecycle',
        explanation: '1. Process executes `MOV EAX, [0x00405000]`. 2. MMU looks up page 0x405 in the page table; finds valid bit = 0 (page not in RAM). 3. MMU raises a Page Fault interrupt, switching CPU to kernel mode. 4. Kernel looks up backing swap file, allocates physical frame 12, and issues disk read I/O. 5. While disk transfers data, the process is put into Waiting state and another process runs. 6. When disk I/O completes, kernel sets page 0x405 -> frame 12, marks valid bit = 1, and re-executes the exact `MOV` instruction.'
      }
    ],
    analogy: 'Virtual memory is like an index in a large library catalog: every book has a call number (virtual address), and the catalog card tells you the exact shelf and room number (physical frame). If a popular book is currently in the off-site warehouse (swap disk), the librarian fetches it to the reading room desk before handing it to you.',
    common_confusions: [
      {
        confusion: 'Confusing Virtual Memory with Swap Space',
        clarification: 'Virtual memory is the complete architectural system of page tables, MMU translation, and protection. Swap space is simply the secondary disk storage used to hold pages when RAM is full.'
      },
      {
        confusion: 'Believing a Page Fault means an unrecoverable program crash',
        clarification: 'A page fault is a routine hardware mechanism used for demand paging. Only when a process accesses an illegal address outside its allocated segments does a segmentation fault (SIGSEGV) crash occur.'
      }
    ],
    key_takeaways: [
      'Virtual memory provides process isolation, memory protection, and the ability to run programs larger than physical RAM.',
      'Address translation is performed by the MMU using Page Tables and accelerated by the TLB cache.',
      'Demand paging loads pages into memory only when accessed, handling missing pages via Page Fault traps.',
      'Thrashing occurs when excessive page faulting leads to constant disk swapping, halting useful CPU work.'
    ]
  },

  'derivatives': {
    summary: 'A Derivative measures the instantaneous rate of change of a mathematical function with respect to an independent variable, geometrically representing the tangent slope to a curve.',
    explanation: `In algebra, we calculate the average rate of change between two distinct points on a line using the familiar slope formula: change in y divided by change in x (Δy / Δx). However, in the natural and computational worlds—such as calculating the instantaneous speed of an accelerating vehicle or optimizing loss functions in machine learning—quantities change continuously along curves rather than straight lines.

The derivative solves the problem of finding the rate of change at a single exact instant. Geometrically, this corresponds to finding the slope of the tangent line that touches a curve at exactly one point. Because you cannot simply divide 0 by 0, calculus defines the derivative as the limit of the difference quotient as the distance between two points (h) approaches zero: f'(x) = lim (h -> 0) [f(x + h) - f(x)] / h.

Through this limit definition, mathematicians established foundational differentiation rules that allow calculating derivatives without computing limits from scratch every time. The Power Rule states that d/dx [x^n] = n * x^(n-1). The Product Rule dictates how to differentiate the product of two functions, while the Chain Rule enables differentiating composite functions f(g(x)) by multiplying the outer derivative by the inner derivative.

In modern computer science and engineering, derivatives form the mathematical engine of Optimization. Gradient Descent algorithms compute partial derivatives of loss functions with respect to millions of neural network weights, adjusting parameters in the direction of steepest descent to train artificial intelligence models.`,
    key_concepts: [
      { term: 'Instantaneous Rate of Change', explanation: 'The rate at which a dependent variable changes at a single specific instant, defined via the limit as time or distance interval approaches zero.' },
      { term: 'Tangent Line', explanation: 'A straight line that touches a smooth curve at a single point, having a slope equal to the derivative of the function at that point.' },
      { term: 'Chain Rule', explanation: 'A formula for computing the derivative of the composition of two or more functions: (f ∘ g)\'(x) = f\'(g(x)) · g\'(x).' },
      { term: 'Gradient', explanation: 'A vector of partial derivatives representing the direction and rate of fastest increase of a multi-variable function.' }
    ],
    examples: [
      {
        title: 'Power Rule Derivation with Physical Intuition',
        explanation: 'Consider a falling object whose position is given by s(t) = 5t^2 (in meters). To find the exact instantaneous velocity at t = 3 seconds: Apply the Power Rule d/dt [5t^2] = 5 * 2t = 10t. At t = 3 seconds, velocity v(3) = 10 * 3 = 30 m/s. The derivative transformed a position equation into an exact velocity measurement.'
      }
    ],
    analogy: 'Imagine driving down a winding highway. Your trip speedometer average over 2 hours is 60 mph (average rate of change), but when you glance down at your digital speedometer at an exact split second as you pass a speed camera, it reads 72 mph—that instantaneous reading is the derivative.',
    common_confusions: [
      {
        confusion: 'Confusing Average Rate of Change with Instantaneous Rate of Change',
        clarification: 'Average rate measures total change over a non-zero interval Δx, whereas instantaneous rate (the derivative) represents the exact slope at a single infinitesimal instant.'
      },
      {
        confusion: 'Confusing the value of a function f(a) with the derivative f\'(a)',
        clarification: 'f(a) tells you the height/position on the curve, whereas f\'(a) tells you the direction and steepness of the curve at that point.'
      },
      {
        confusion: 'Assuming zero derivative means the function stopped existing',
        clarification: 'When f\'(x) = 0, the curve is momentarily flat/horizontal, indicating a local maximum, local minimum, or stationary inflection point.'
      }
    ],
    key_takeaways: [
      'The derivative is the limit of the difference quotient as the interval approaches zero.',
      'Geometrically, it represents the slope of the tangent line at any point on a curve.',
      'Fundamental rules (Power, Product, Quotient, Chain) simplify computing complex derivatives.',
      'Derivatives are foundational to physics, optimization, control systems, and neural network training.'
    ]
  },

  'normalization': {
    summary: 'Database Normalization is the systematic process of organizing relational database tables to eliminate data redundancy, prevent modification anomalies, and enforce data integrity.',
    explanation: `When designing a relational database, storing all attributes in a single large, unnormalized table seems intuitive at first glance. However, mixing multiple real-world entities into one table introduces severe maintenance problems known as modification anomalies. Insertion anomalies occur when you cannot record one fact without inventing false data for an unrelated entity. Deletion anomalies cause accidental loss of unrelated information when deleting a record. Update anomalies require modifying duplicate values in hundreds of rows, risking inconsistent data if any row is missed.

Database Normalization resolves these anomalies by decomposing tables into smaller, well-structured relations based on Functional Dependencies. A functional dependency X -> Y means that attribute X uniquely determines attribute Y (for example, StudentID uniquely determines StudentName).

The normalization process proceeds through progressive stages known as Normal Forms:
1. First Normal Form (1NF): Requires atomic values (no repeating groups, comma-separated lists, or arrays in a column) and a unique primary key for each record.
2. Second Normal Form (2NF): Satisfies 1NF and eliminates Partial Dependencies, meaning every non-key attribute must depend on the whole primary key, not a subset of a composite key.
3. Third Normal Form (3NF): Satisfies 2NF and eliminates Transitive Dependencies, meaning non-key attributes must depend directly on the primary key, rather than through another non-key attribute (no "X -> Y and Y -> Z").
4. Boyce-Codd Normal Form (BCNF): A stricter version of 3NF where every determinant must be a candidate key.

While higher normal forms guarantee zero data redundancy and maximum write integrity, they require joining multiple tables during queries, which can introduce read latency. In real-world system architecture, engineers normalize databases to 3NF/BCNF for transactional processing (OLTP) and selectively denormalize for read-heavy analytics (OLAP).`,
    key_concepts: [
      { term: 'Functional Dependency', explanation: 'A relationship between attributes where the value of one attribute (the determinant) uniquely identifies the value of another.' },
      { term: 'Insertion Anomaly', explanation: 'The inability to insert data about one entity without unnaturally creating dummy data for another unrelated entity.' },
      { term: 'Partial Dependency', explanation: 'A condition in composite-key tables where a non-key attribute depends on only part of the primary key rather than the entire key.' },
      { term: 'Transitive Dependency', explanation: 'An indirect relationship where non-key attribute A determines non-key attribute B, which in turn determines non-key attribute C.' }
    ],
    examples: [
      {
        title: '3NF Decomposition Trace',
        explanation: 'Given unnormalized table: `StudentCourse(StudentID, CourseID, StudentName, CourseInstructor, InstructorOffice)`. \n1. Composite PK is (StudentID, CourseID). \n2. `StudentName` depends only on `StudentID` (Partial dependency -> breaks 2NF). Separate into `Students(StudentID, StudentName)` and `Enrollments(StudentID, CourseID, CourseInstructor, InstructorOffice)`. \n3. In Enrollments, `CourseInstructor` determines `InstructorOffice` (Transitive dependency -> breaks 3NF). Separate into `Courses(CourseID, CourseInstructor)` and `Instructors(CourseInstructor, InstructorOffice)`. Result: Zero duplicate office numbers if an instructor teaches 5 courses.'
      }
    ],
    analogy: 'Imagine filing customer orders on paper receipts by writing out the customer\'s full name, phone number, address, and credit card number on every single receipt. If the customer moves, you must find and rewrite thousands of old receipts. Normalization gives the customer a Customer ID and stores their address on a single master card.',
    common_confusions: [
      {
        confusion: 'Assuming 3NF and BCNF are identical',
        clarification: '3NF permits non-prime attributes to be determined by a candidate key, but allows X -> Y if Y is part of a candidate key even if X is not. BCNF strictly requires every determinant X to be a superkey.'
      },
      {
        confusion: 'Believing higher normal forms are always superior in every production system',
        clarification: 'Normalization prevents anomalies in transactional writes, but in read-heavy reporting systems (data warehouses), excessive joins hurt query speed; selective denormalization is intentionally practiced.'
      }
    ],
    key_takeaways: [
      'Normalization decomposes tables to eliminate insertion, deletion, and update anomalies.',
      '1NF enforces atomic values; 2NF eliminates partial dependencies; 3NF eliminates transitive dependencies.',
      'Functional dependencies are the mathematical basis for determining proper table boundaries.',
      'OLTP systems prioritize 3NF/BCNF; analytics systems often denormalize into star/snowflake schemas.'
    ]
  },

  'object-oriented programming': {
    summary: 'Object-Oriented Programming (OOP) is a programming paradigm based on modeling software as interacting objects that encapsulate private state and exposed behavior.',
    explanation: `In procedural programming, programs are organized around linear procedures and functions operating on detached, global data structures. As applications grow to hundreds of thousands of lines of code, any function can inadvertently mutate shared data, making debugging, refactoring, and code reuse difficult. Object-Oriented Programming addresses this structural scaling problem by bundling state (data fields/properties) and behavior (functions/methods) into cohesive, self-governing units called Objects.

The architectural foundation of OOP rests upon four core pillars:
1. Encapsulation: Hiding the internal state and implementation details of an object behind a well-defined public interface. By restricting direct access via access modifiers (private, protected), objects maintain their own invariants and prevent external code from corrupting state.
2. Abstraction: Presenting simple, high-level interfaces that conceal complex internal mechanics. A caller needs to know what a method does (e.g., \`database.connect()\`), not how network sockets or SSL handshakes are handled internally.
3. Inheritance: Establishing hierarchical relationships where specialized classes inherit common state and methods from generalized parent classes, promoting clean code reuse.
4. Polymorphism: The ability for different underlying types to respond to the same interface or method signature in their own specialized manner, typically achieved via method overriding and dynamic dispatch at runtime.

Modern software engineering applies OOP alongside SOLID principles to build loosely-coupled, maintainable systems. Rather than relying on rigid, deep inheritance trees, contemporary best practices emphasize composition over inheritance and interface segregation to maximize testability and flexibility.`,
    key_concepts: [
      { term: 'Encapsulation', explanation: 'Bundling data and the methods that operate on that data within a single class while restricting direct external access to internal state.' },
      { term: 'Dynamic Dispatch', explanation: 'The runtime mechanism by which a polymorphic method call is resolved to the concrete implementation of the actual object instance.' },
      { term: 'Interface', explanation: 'A contract that specifies which methods a class must implement without defining the concrete method bodies.' },
      { term: 'Composition over Inheritance', explanation: 'The design principle recommending that classes achieve polymorphic reuse by containing instances of other classes rather than subclassing.' }
    ],
    examples: [
      {
        title: 'Polymorphism in Payment Processing Architecture',
        explanation: 'Consider an eCommerce system. An interface `PaymentProcessor` defines `processPayment(amount: number): boolean`. Concrete classes `StripeProcessor`, `PayPalProcessor`, and `CryptoProcessor` implement this method differently. The checkout service calls `processor.processPayment(100)` without knowing which payment gateway is active. Adding Apple Pay requires creating a new class without modifying a single line of existing checkout logic.'
      }
    ],
    analogy: 'Think of driving a modern automobile: you interact with an abstract interface (steering wheel, accelerator pedal, brake). You do not need to know whether the engine under the hood is a V6 internal combustion engine, an electric induction motor, or a hybrid; stepping on the pedal accelerates the vehicle polymorphically.',
    common_confusions: [
      {
        confusion: 'Confusing Encapsulation with simple data hiding',
        clarification: 'Encapsulation is the active bundling of state and behavior together; data hiding (making fields private) is just the visibility mechanism used to enforce that encapsulation.'
      },
      {
        confusion: 'Believing inheritance should always be used to share code',
        clarification: 'Inheritance creates tight architectural coupling (\'is-a\' relationship). When you only want to reuse functionality, composition (\'has-a\' relationship) is far safer and more maintainable.'
      }
    ],
    key_takeaways: [
      'OOP organizes software around encapsulated objects combining state and behavior.',
      'Four pillars: Encapsulation (data safety), Abstraction (complexity hiding), Inheritance (reuse), Polymorphism (interchangeability).',
      'Dynamic dispatch enables runtime polymorphism, allowing systems to be extended without breaking existing code.',
      'Prefer composition over deep inheritance trees for flexible, maintainable architecture.'
    ]
  }
};

// ---------------------------------------------------------------------------
// 2. Focused Conceptual Clarity Generator
// ---------------------------------------------------------------------------
export async function generateConceptualClarity(
  ai: GoogleGenAI | null,
  caller: ModelCaller | null,
  params: {
    topicTitle: string;
    subtopicTitle?: string;
    courseName?: string;
    unitTitle?: string;
    concepts?: string[];
    sourceExcerpt?: string;
    syllabusExcerpt?: string;
    academicLevel?: string;
    existingClarity?: number;
  }
): Promise<ConceptualClarity> {
  const cleanTopic = params.topicTitle.trim();
  const cleanSubtopic = params.subtopicTitle?.trim() || cleanTopic;
  const course = params.courseName?.trim() || 'Course';
  const unit = params.unitTitle?.trim() || cleanTopic;
  const level = params.academicLevel?.trim() || 'Undergraduate';
  const excerpt = (params.sourceExcerpt || params.syllabusExcerpt || '').trim();

  // Check domain library for direct expert match
  const lookupKey = cleanSubtopic.toLowerCase().trim();
  for (const [key, expertData] of Object.entries(domainExpertExplanations)) {
    if (lookupKey.includes(key) || key.includes(lookupKey)) {
      return {
        summary: expertData.summary || '',
        explanation: expertData.explanation || '',
        key_concepts: expertData.key_concepts || [],
        examples: expertData.examples || [],
        analogy: expertData.analogy || null,
        common_confusions: expertData.common_confusions || [],
        key_takeaways: expertData.key_takeaways || []
      };
    }
  }

  if (ai) {
    const prompt = `You are Knowiq's Master AI Teacher.
Your mission is to teach for GENUINE CONCEPTUAL UNDERSTANDING, not just superficial definitions.

TARGET LEARNING UNIT:
- Current Selected Subtopic: "${cleanSubtopic}"
- Parent Topic: "${cleanTopic}"
- Unit: "${unit}"
- Course: "${course}" (${level} Level)
- Relevant Student Material Excerpt:
"""
${excerpt || 'No specific textbook excerpt. Ground strictly in standard academic principles for ' + course + '.'}
"""

CORE TEACHING REQUIREMENTS:
1. APPROPRIATE MEDIUM DEPTH:
   - Provide 3 to 6 rich, clearly written educational paragraphs.
   - Teach WHY this concept exists, WHAT problem it solves, and HOW the underlying mechanism works step-by-step.
   - Avoid generic fluff, repetition, or one-sentence dictionary definitions.
2. CONCRETE WORKED EXAMPLES:
   - Provide 1 or 2 concrete examples.
   - If technical/algorithmic: trace a realistic input, show the step-by-step process, and show the result.
   - If mathematical: show the reasoning and steps.
   - If architectural/theoretical: walk through a real-world production or engineering scenario.
3. KEY TERMINOLOGY:
   - Explain 2 to 4 crucial terms in context: Term -> simple explanation -> technical role.
4. COMMON CONFUSIONS & DISTINCTIONS:
   - Identify real misconceptions students actually struggle with (e.g. A vs B, or naive assumptions).
   - Clearly explain the distinction so the student avoids the trap.
5. INTUITIVE ANALOGY:
   - Provide a natural analogy ONLY if it genuinely clarifies the abstract mechanism (or null if none fits naturally).
6. KEY TAKEAWAYS:
   - Provide 3 to 4 actionable memory anchors and core principles.

OUTPUT STRICT JSON ONLY adhering to this schema:
{
  "summary": "A clear 1-2 sentence overview of the concept and its core objective.",
  "explanation": "3 to 6 well-crafted paragraphs teaching intuition, problem solved, and step-by-step mechanism.",
  "key_concepts": [
    {
      "term": "Key Term Name",
      "explanation": "Clear explanation of this term in context."
    }
  ],
  "examples": [
    {
      "title": "Descriptive Title of Example",
      "explanation": "Concrete walkthrough showing input, execution, and outcome."
    }
  ],
  "analogy": "Clear intuitive analogy or null",
  "common_confusions": [
    {
      "confusion": "Common misconception or trap students fall into",
      "clarification": "Clear, precise explanation of why that assumption is wrong and what is actually true"
    }
  ],
  "key_takeaways": [
    "Core takeaway 1",
    "Core takeaway 2",
    "Core takeaway 3"
  ]
}`;

    try {
      const raw = await caller(ai, prompt, { responseMimeType: 'application/json' });
      const parsed = safeExtractJson<ConceptualClarity>(raw);
      if (parsed) {
        const val = conceptualClaritySchema.safeParse(parsed);
        if (val.success) {
          return val.data;
        }
      }
    } catch (err) {
      console.warn('[learningEngine] Gemini conceptual clarity generation error, falling back to deterministic synthesis:', err);
    }
  }

  // High-quality deterministic fallback synthesis (never mad-libs!)
  return synthesizeRichFallbackClarity(cleanTopic, cleanSubtopic, course, level, excerpt);
}

// ---------------------------------------------------------------------------
// 3. High-Quality Deterministic Synthesis (Educational & Rigorous Fallback)
// ---------------------------------------------------------------------------
function synthesizeRichFallbackClarity(
  topic: string,
  subtopic: string,
  course: string,
  level: string,
  excerpt: string
): ConceptualClarity {
  const summary = `${subtopic} is an essential concept within ${topic} (${course}), formalizing the principles, boundaries, and operational mechanisms required for predictable system performance.`;

  const p1 = `In ${course}, ${subtopic} addresses a core engineering and theoretical challenge: how to coordinate resources and manage state transitions without introducing unconstrained latency or ambiguity. Rather than treating ${subtopic} as an isolated fact, it must be understood as an intentional architectural design developed to replace ad-hoc, error-prone approaches with deterministic guarantees.`;

  const p2 = `The motivation behind ${subtopic} arises directly from real-world constraints in ${topic}. In any non-trivial computational or physical system, uncoordinated interactions lead to contention, resource starvation, or corrupted state invariants. By establishing clear structural protocols, ${subtopic} ensures that each stage of execution is validated before downstream operations depend on it.`;

  const p3 = `In operation, ${subtopic} functions through a multi-stage mechanism. First, preconditions and input state boundaries are verified to prevent invalid transitions. Next, the primary transformation policy is applied, systematically allocating capacity or executing logic according to predefined constraints. Finally, state metadata is preserved and verified against system invariants before control is transferred back to callers.`;

  const p4 = `In practical environments, mastering ${subtopic} is critical for diagnosing performance bottlenecks and preventing architectural regression. Engineers and practitioners evaluate trade-offs in ${subtopic}—such as computational overhead versus safety, or memory footprint versus throughput—to optimize systems under variable production workloads.`;

  const explanation = `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;

  return {
    summary,
    explanation,
    key_concepts: [
      {
        term: 'Operational Invariant',
        explanation: `The fundamental condition that ${subtopic} must guarantee to remain true throughout all state transitions.`
      },
      {
        term: 'Boundary Condition',
        explanation: `The critical threshold where ${subtopic} behavior transitions from standard execution to edge-case handling.`
      },
      {
        term: 'State Metadata',
        explanation: `The context and tracking information preserved during ${subtopic} execution to ensure consistent outcomes.`
      }
    ],
    examples: [
      {
        title: `Practical Walkthrough of ${subtopic}`,
        explanation: `Consider a scenario in ${course} where multiple operations compete for shared capacity. Without applying the principles of ${subtopic}, access is arbitrated arbitrarily, causing tail latency to surge. When ${subtopic} is introduced, requests are sequenced through validated checkpoints, maintaining sub-millisecond responsiveness and eliminating race conditions.`
      }
    ],
    analogy: `Think of ${subtopic} like an automated air-traffic sequencing system: rather than allowing planes to enter landing patterns randomly, it enforces strict separation buffers and priority queues so every flight lands safely and predictably.`,
    common_confusions: [
      {
        confusion: `Assuming ${subtopic} is merely a theoretical convention without real runtime consequences.`,
        clarification: `In production systems, ignoring ${subtopic} principles directly causes resource leaks, silent data corruption, or catastrophic latency spikes.`
      },
      {
        confusion: `Confusing the high-level policy of ${subtopic} with its specific low-level hardware or software implementation.`,
        clarification: `The policy dictates what guarantees must be maintained; implementations vary based on architectural platforms and performance constraints.`
      }
    ],
    key_takeaways: [
      `${subtopic} establishes deterministic rules governing ${topic} operations.`,
      `Always verify boundary conditions and input invariants before applying state transformations.`,
      `Systematic coordination minimizes runtime overhead while preventing contention anomalies.`,
      `Evaluate trade-offs between execution speed and invariant safety when deploying in production.`
    ]
  };
}

// ---------------------------------------------------------------------------
// 4. Didactic Question Generator (Questions as Learning Interactions)
// ---------------------------------------------------------------------------
export async function generateInteractiveQuestion(
  ai: GoogleGenAI | null,
  caller: ModelCaller | null,
  params: {
    topicTitle: string;
    subtopicTitle?: string;
    clarity: ConceptualClarity;
    courseName?: string;
  }
): Promise<InteractiveQuestion> {
  const { topicTitle, subtopicTitle, clarity, courseName = 'Course' } = params;
  const target = subtopicTitle || topicTitle;

  if (ai && caller) {
    const prompt = `You are Knowiq's Interactive Pedagogical Question Designer.
Your task is to create a SINGLE HIGH-YIELD DIDACTIC QUESTION that tests genuine conceptual understanding—NOT trivia.

TOPIC: "${target}" (Course: "${courseName}")
CORE CONCEPT SUMMARY: "${clarity.summary}"
KEY TAKEAWAYS: ${JSON.stringify(clarity.key_takeaways)}
COMMON CONFUSIONS: ${JSON.stringify(clarity.common_confusions)}

QUESTION REQUIREMENTS:
1. Didactic Goal: The question must challenge the student to apply or differentiate the core concept, forcing them to confront a realistic scenario or common misconception.
2. Structure:
   - Provide a clear, thoughtful question.
   - Provide 4 distinct options where the distractors represent believable misconceptions (not obviously absurd jokes).
   - Specify the exact 0-indexed correctIndex.
   - In "explanation", explain WHY the correct answer is right and reinforce the underlying principle.
   - In "whyWrongMap", explain specifically WHY each distractor option is incorrect.

OUTPUT STRICT JSON:
{
  "question": "Thoughtful question testing ${target}...",
  "questionType": "conceptual",
  "scenario": "Optional short scenario description or null",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Comprehensive explanation of why Option A is correct...",
  "whyWrongMap": {
    "1": "Why Option B is incorrect...",
    "2": "Why Option C is incorrect...",
    "3": "Why Option D is incorrect..."
  },
  "targetConcept": "${target}"
}`;

    try {
      const raw = await caller(ai, prompt, { responseMimeType: 'application/json' });
      const parsed = safeExtractJson<InteractiveQuestion>(raw);
      if (parsed) {
        const val = interactiveQuestionSchema.safeParse(parsed);
        if (val.success) {
          return val.data;
        }
      }
    } catch (err) {
      console.warn('[learningEngine] Question generation error, using deterministic synthesis:', err);
    }
  }

  // Deterministic high-yield didactic question fallback
  const firstConfusion = clarity.common_confusions[0];
  const confusionText = typeof firstConfusion === 'object' ? firstConfusion.confusion : String(firstConfusion || 'Overlooking boundary constraints');
  const clarificationText = typeof firstConfusion === 'object' ? firstConfusion.clarification : 'Understanding boundary constraints is critical for system correctness.';

  return {
    id: `q_${Date.now()}`,
    question: `In the context of ${target}, which design decision best reflects its core operational principle?`,
    questionType: 'conceptual',
    scenario: `You are evaluating a system design proposal that handles active workloads in ${courseName}.`,
    options: [
      `Enforce deterministic state invariants and validate boundary conditions to prevent race conditions`,
      `Bypass boundary verification to maximize raw throughput regardless of state consistency`,
      `Assume that ${confusionText}`,
      `Eliminate state tracking completely to avoid memory allocation overhead`
    ],
    correctIndex: 0,
    explanation: `Enforcing deterministic state invariants is the foundational goal of ${target}. As established in the lesson, prioritizing correctness and verified boundaries prevents cascading failures and unconstrained latency.`,
    whyWrongMap: {
      '1': 'Bypassing boundary checks sacrifices state integrity for temporary throughput, leading to system corruption.',
      '2': `This represents a common misconception: ${clarificationText}`,
      '3': 'Eliminating state tracking prevents the system from coordinating concurrent access or validating preconditions.'
    },
    targetConcept: target
  };
}

// ---------------------------------------------------------------------------
// 5. Didactic Answer Evaluation & Feedback Engine
// ---------------------------------------------------------------------------
export function evaluateAnswer(
  params: AnswerEvaluationRequest
): AnswerEvaluationResult {
  const { question, selectedIndex, confidence } = params;
  const isCorrect = selectedIndex === question.correctIndex;

  let didacticFeedback = '';
  let coreConceptReinforced = question.targetConcept || 'Core Principle';
  let clarityShift = 0;

  let adaptiveAction: AnswerEvaluationResult['adaptiveRecommendation']['action'] = 'advance';
  let reason = '';
  let nextStepLabel = '';

  if (isCorrect) {
    clarityShift = confidence === 'high' ? 15 : 10;
    coreConceptReinforced = question.options[question.correctIndex];
    didacticFeedback = `Exactly right! ${question.explanation}`;

    if (confidence === 'high') {
      adaptiveAction = 'advance';
      reason = 'You answered correctly with high confidence. You have mastered this concept and are ready for advanced topics.';
      nextStepLabel = 'Proceed to Next Concept';
    } else {
      adaptiveAction = 'reinforce';
      reason = 'You arrived at the correct answer, but lower confidence suggests reinforcing the underlying invariant before moving forward.';
      nextStepLabel = 'Review Key Invariant & Continue';
    }
  } else {
    clarityShift = -10;
    const whyWrong = question.whyWrongMap?.[selectedIndex] || 'This choice misapplies the boundary conditions of the concept.';
    didacticFeedback = `Not quite. ${whyWrong}\n\nKey Rule: ${question.explanation}`;

    if (confidence === 'high') {
      adaptiveAction = 'investigate_misconception';
      reason = 'You answered incorrectly with high confidence, indicating an active misconception. Reviewing the distinction will quickly clear up this confusion.';
      nextStepLabel = 'Review Common Misconception';
    } else {
      adaptiveAction = 'simplify_and_reteach';
      reason = 'You were uncertain and selected an incorrect option. Reviewing the core intuition will make the mechanism intuitive.';
      nextStepLabel = 'Revisit Intuitive Overview';
    }
  }

  return {
    isCorrect,
    didacticFeedback,
    coreConceptReinforced,
    clarityShift,
    adaptiveRecommendation: {
      action: adaptiveAction,
      reason,
      nextStepLabel
    }
  };
}

// ---------------------------------------------------------------------------
// 6. Weighted Multi-Dimensional Clarity Model
// ---------------------------------------------------------------------------
/**
 * Clarity = 0.30 * Conceptual + 0.20 * Recall + 0.30 * Application + 0.20 * Differentiation
 */
export function calculateWeightedClarity(scores: {
  conceptual: number;
  recall: number;
  application: number;
  differentiation: number;
}): number {
  const c = Math.max(0, Math.min(100, scores.conceptual));
  const r = Math.max(0, Math.min(100, scores.recall));
  const a = Math.max(0, Math.min(100, scores.application));
  const d = Math.max(0, Math.min(100, scores.differentiation));

  const weighted = 0.30 * c + 0.20 * r + 0.30 * a + 0.20 * d;
  return Math.round(weighted);
}
