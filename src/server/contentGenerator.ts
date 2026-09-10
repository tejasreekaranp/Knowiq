// Comprehensive pedagogical fallback generator for KnowIQ
// Ensures zero-downtime, resilient learning experience even during model outages or 503 spikes

export interface FallbackSubtopicContent {
  conceptual: {
    quick: string;
    standard: string;
    deep: string;
    expert: string;
    whatIsIt: string;
    whyExists: string;
    problemSolved: string;
    keyTakeaway: string;
  };
  interactive: {
    fillBlank: {
      question: string;
      preText: string;
      missingWord: string;
      postText: string;
      options: string[];
      hint: string;
      explanation: string;
    };
    matching: Array<{ id: string; term: string; definition: string }>;
    ordering: {
      title: string;
      instruction: string;
      items: Array<{ id: string; text: string; correctOrder: number }>;
    };
  };
  deepRevision: {
    detailedNotes: string[];
    comparisonTable: {
      title: string;
      headers: string[];
      rows: string[][];
    };
    commonPitfalls: string[];
    mentalModelOrMnemonic: string;
  };
  hardQuiz: Array<{
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    category: 'conceptual' | 'recall' | 'application' | 'differentiation';
    explanation: string;
  }>;
  externalResources: Array<{
    type: 'video' | 'article' | 'reference';
    title: string;
    source: string;
    description: string;
    url: string;
    tag: string;
  }>;
}

// Curated high-yield topics repository
const curatedLibrary: Record<string, Partial<FallbackSubtopicContent>> = {
  'process concept, states & pcb': {
    conceptual: {
      quick: 'A process is an active program in execution, managed via a Process Control Block (PCB) tracking state, PC, registers, and memory boundaries.',
      standard: 'In modern operating systems, a process is the core abstraction for executing programs. It encapsulates the code (text section), current activity represented by the Program Counter and processor registers, a call stack for function parameters and local variables, and a heap for dynamically allocated memory. The OS tracks each process via a Process Control Block (PCB).',
      deep: 'The Process Control Block (PCB) acts as the operational manifest: it stores the unique PID, process state (New, Ready, Running, Waiting, Terminated), CPU registers, CPU scheduling priority, memory-management information (base/limit registers or page tables), accounting information, and I/O status. When switching between processes, the kernel performs a context switch: saving current hardware registers into the old PCB and restoring the state of the newly scheduled PCB.',
      expert: 'Context switch latency is pure computational overhead where no useful user work occurs. The kernel executes privileged routines to flush or invalidate TLBs (unless tagged with Address Space Identifiers / ASIDs), switch page directory base registers (CR3 in x86_64), and reload task registers, with typical latency ranging from fractions of a microsecond to several microseconds depending on memory hierarchy penalties.',
      whatIsIt: 'The foundational abstraction of a running program and its kernel tracking data structure (PCB).',
      whyExists: 'To provide safe resource isolation, virtualized CPU access, and deterministic multitasking among concurrent programs.',
      problemSolved: 'Eliminates uncoordinated hardware access and prevents rogue programs from corrupting physical memory.',
      keyTakeaway: 'A process is an active program in execution; the Process Control Block (PCB) is the kernel manifest storing its entire CPU context.'
    },
    interactive: {
      fillBlank: {
        question: 'Identify the kernel tracking structure:',
        preText: 'The operating system kernel maintains all state, register values, and scheduling metadata for an active process inside the',
        missingWord: 'Process Control Block',
        postText: 'data structure.',
        options: ['Process Control Block', 'Memory Management Unit', 'Interrupt Vector Table', 'File Allocation Table'],
        hint: 'Also known as task_struct in the Linux kernel.',
        explanation: 'The Process Control Block (PCB or task_struct in Linux) is the kernel data structure maintaining the entire execution context of a process.'
      },
      matching: [
        { id: 'm-pcb-1', term: 'Ready State', definition: 'Process is in memory awaiting CPU core assignment from the scheduler' },
        { id: 'm-pcb-2', term: 'Running State', definition: 'Process instructions are currently being executed by the CPU' },
        { id: 'm-pcb-3', term: 'Waiting (Blocked) State', definition: 'Process cannot execute until an external I/O event or signal completes' },
        { id: 'm-pcb-4', term: 'Terminated State', definition: 'Process has finished execution and awaits PCB cleanup by its parent' }
      ],
      ordering: {
        title: 'Context Switch Execution Sequence',
        instruction: 'Order the kernel events during a preemptive process context switch:',
        items: [
          { id: 'seq-1', text: 'Hardware timer interrupt triggers kernel interrupt service routine', correctOrder: 1 },
          { id: 'seq-2', text: 'Current register context saved into current process PCB', correctOrder: 2 },
          { id: 'seq-3', text: 'Process state changed from Running to Ready and queued', correctOrder: 3 },
          { id: 'seq-4', text: 'CPU scheduler algorithm picks next highest-priority ready process', correctOrder: 4 },
          { id: 'seq-5', text: 'Hardware registers restored from new process PCB and PC dispatched', correctOrder: 5 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        'A process includes code, data, heap, and stack; a context switch requires saving and restoring register state.',
        'The PCB represents the process to the OS. Linux uses task_struct defined in <linux/sched.h>.',
        'State transitions: New -> Ready -> Running -> Waiting (for I/O) or Terminated.'
      ],
      comparisonTable: {
        title: 'Process vs Thread System Trade-offs',
        headers: ['Dimension', 'Process', 'Thread'],
        rows: [
          ['Address Space', 'Isolated virtual memory', 'Shares parent virtual memory'],
          ['Context Switch Overhead', 'High (CR3 register switch, TLB flush)', 'Low (registers & stack pointer only)'],
          ['Fault Isolation', 'Total; crash does not affect other processes', 'Low; memory corruption affects entire process']
        ]
      },
      commonPitfalls: [
        'Assuming context switches are free: TLB invalidation causes severe cache miss storms on re-entry.',
        'Allowing zombie processes to accumulate by not calling wait() or handling SIGCHLD.'
      ],
      mentalModelOrMnemonic: 'Mnemonic: "A program is a recipe on disk; a process is the cook actively executing it in the kitchen."'
    },
    hardQuiz: [
      {
        id: 'os-pcb-1',
        question: 'Which of the following events strictly requires a transition to the Waiting (Blocked) state rather than Ready?',
        options: [
          'Synchronous read() system call awaiting disk block arrival',
          'Expiration of the CPU time slice quantum',
          'Preemption by a higher-priority real-time process',
          'Arrival of an unmasked hardware timer interrupt'
        ],
        correctIndex: 0,
        category: 'conceptual',
        explanation: 'Synchronous I/O operations cannot proceed until hardware completes the transfer, requiring a transition to Waiting. Timer expiration and preemption leave the process ready to run immediately.'
      },
      {
        id: 'os-pcb-2',
        question: 'What is the primary architectural overhead associated with a context switch between two different processes compared to two threads in the same process?',
        options: [
          'Flushing/invalidation of the Translation Lookaside Buffer (TLB) and virtual address space reassignment',
          'Saving general-purpose integer registers %rax through %rdx',
          'Updating the kernel tick counter',
          'Clearing the program counter to 0x0'
        ],
        correctIndex: 0,
        category: 'differentiation',
        explanation: 'Processes have independent virtual address spaces. Switching processes requires changing the page table pointer (e.g., CR3 register), which invalidates the TLB unless PCID/ASIDs are supported.'
      },
      {
        id: 'os-pcb-3',
        question: 'A process that has finished execution via exit() but whose parent process has not yet invoked wait() is known as:',
        options: [
          'A Zombie process',
          'An Orphan process',
          'A Daemon process',
          'A Deadlock process'
        ],
        correctIndex: 0,
        category: 'recall',
        explanation: 'A zombie process has terminated and released its memory, but retains an entry in the process table so its parent can read its exit status code.'
      }
    ],
    externalResources: [
      {
        type: 'reference',
        title: 'Operating Systems: Three Easy Pieces (OSTEP) - Virtualization & Processes',
        source: 'Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau (University of Wisconsin-Madison)',
        description: 'Chapter 4: The Abstraction: The Process and Context Switching Mechanics.',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf',
        tag: 'Foundational Textbook'
      },
      {
        type: 'video',
        title: 'MIT 6.S081: Operating System Engineering - Processes and Isolation',
        source: 'MIT OpenCourseWare (YouTube)',
        description: 'In-depth lecture on kernel process isolation, context switching, and trap handling in xv6.',
        url: 'https://www.youtube.com/results?search_query=MIT+6.S081+processes+context+switch',
        tag: 'Academic Lecture'
      }
    ]
  },
  'cpu scheduling algorithms': {
    conceptual: {
      quick: 'CPU scheduling algorithms decide which process in the ready queue receives CPU time to optimize turnaround, response time, and fairness.',
      standard: 'The CPU scheduler is the kernel subsystem responsible for allocating processor cores among ready processes. Algorithms range from non-preemptive approaches (FCFS, Non-preemptive SJF) to preemptive algorithms (Round Robin, Shortest Remaining Time First, and Multilevel Feedback Queues). Key performance metrics include CPU utilization, throughput, turnaround time, waiting time, and response time.',
      deep: 'Preemptive scheduling enables the kernel to interrupt a running process when a higher-priority task arrives or when the allocated time quantum expires. The Multilevel Feedback Queue (MLFQ) solves the challenge of optimizing both turnaround time for long batch jobs and response time for interactive I/O-bound jobs without prior knowledge of execution bursts.',
      expert: 'Modern kernels like Linux use the Completely Fair Scheduler (CFS). CFS models an ideal multi-tasking CPU using a red-black tree indexed by virtual runtime (vruntime). The process that has received the least CPU time (minimum vruntime) is dispatched next, with process priorities mapped to nice values weighting the accumulation rate of vruntime.',
      whatIsIt: 'Algorithmic policies for allocating CPU cores among competing ready processes.',
      whyExists: 'To maximize CPU throughput, minimize interactive latency, and prevent starvation.',
      problemSolved: 'Resolves CPU contention and avoids unfair execution bottlenecks.',
      keyTakeaway: 'CPU scheduling governs processor allocation to maximize throughput and responsiveness.'
    },
    interactive: {
      fillBlank: {
        question: 'Identify the scheduling parameter:',
        preText: 'In Round Robin scheduling, the fixed slice of processor time assigned to each process is called the',
        missingWord: 'Time Quantum',
        postText: 'before preemption occurs.',
        options: ['Time Quantum', 'Context Interval', 'Burst Threshold', 'Priority Band'],
        hint: 'Typically calibrated between 10ms and 100ms in interactive systems.',
        explanation: 'The time quantum (or time slice) dictates how long a process can run before being preempted by the timer interrupt.'
      },
      matching: [
        { id: 'm-sched-1', term: 'First-Come, First-Served (FCFS)', definition: 'Non-preemptive algorithm susceptible to the convoy effect' },
        { id: 'm-sched-2', term: 'Shortest Job First (SJF)', definition: 'Provably optimal average waiting time, requires burst time prediction' },
        { id: 'm-sched-3', term: 'Round Robin (RR)', definition: 'Preemptive time-sliced policy designed for interactive response times' },
        { id: 'm-sched-4', term: 'Multilevel Feedback Queue', definition: 'Dynamically adjusts process priority based on observed CPU/IO burst behavior' }
      ],
      ordering: {
        title: 'Round Robin Dispatch Cycle',
        instruction: 'Order the steps in a Round Robin scheduling time slice:',
        items: [
          { id: 'seq-rr-1', text: 'Process placed at tail of Ready Queue with initialized quantum', correctOrder: 1 },
          { id: 'seq-rr-2', text: 'CPU dispatched to process for execution', correctOrder: 2 },
          { id: 'seq-rr-3', text: 'Hardware timer interrupts upon quantum expiration', correctOrder: 3 },
          { id: 'seq-rr-4', text: 'Kernel context switches current process to tail of Ready Queue', correctOrder: 4 },
          { id: 'seq-rr-5', text: 'Head process of Ready Queue dispatched to CPU core', correctOrder: 5 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        'Scheduling goals: Maximize CPU utilization and throughput; minimize turnaround time, waiting time, and response time.',
        'SJF is optimal for average waiting time, but predicting future CPU burst lengths requires exponential smoothing.',
        'Round Robin performance heavily depends on the size of the time quantum relative to context switch latency.'
      ],
      comparisonTable: {
        title: 'CPU Scheduling Algorithm Comparison',
        headers: ['Algorithm', 'Preemptive', 'Primary Metric Favored', 'Primary Drawback'],
        rows: [
          ['FCFS', 'No', 'Simplicity & Fairness', 'Convoy effect halts short jobs'],
          ['SJF / SRTF', 'Yes or No', 'Average Waiting Time', 'Starvation of long jobs'],
          ['Round Robin', 'Yes', 'Response Time', 'High context switch overhead if quantum is too small'],
          ['Multilevel Feedback Queue', 'Yes', 'Adaptive Multi-objective', 'Complex tuning of aging thresholds']
        ]
      },
      commonPitfalls: [
        'Setting Round Robin time quantum too small: CPU spends 50%+ of cycles performing context switches.',
        'Unbounded priority queues without aging: Low-priority jobs starve indefinitely.'
      ],
      mentalModelOrMnemonic: 'Mnemonic: "Round Robin is like speed dating for processes; everyone gets equal turns."'
    },
    hardQuiz: [
      {
        id: 'os-sched-1',
        question: 'Which scheduling algorithm is provably optimal in minimizing average waiting time for a given set of stationary processes?',
        options: [
          'Shortest Job First (SJF)',
          'First-Come, First-Served (FCFS)',
          'Round Robin with large quantum',
          'Priority scheduling without aging'
        ],
        correctIndex: 0,
        category: 'conceptual',
        explanation: 'Shortest Job First (SJF / Shortest Remaining Time First) is provably optimal for minimizing average waiting time by scheduling shorter bursts ahead of longer ones.'
      },
      {
        id: 'os-sched-2',
        question: 'In a system running Round Robin scheduling, what is the consequence of making the time quantum infinitely large?',
        options: [
          'It degenerates into First-Come, First-Served (FCFS) scheduling',
          'It becomes equivalent to Shortest Job First',
          'Context switch overhead increases exponentially',
          'System response time approaches zero'
        ],
        correctIndex: 0,
        category: 'differentiation',
        explanation: 'If the time quantum exceeds the CPU burst of any process, no process is ever preempted by time slice expiration, behaving identically to FCFS.'
      }
    ],
    externalResources: [
      {
        type: 'reference',
        title: 'Operating Systems: Three Easy Pieces - Scheduling Intro & MLFQ',
        source: 'OSTEP Book',
        description: 'Chapters 7, 8, 9: Complete breakdown of scheduling metrics, SJF, RR, and MLFQ.',
        url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf',
        tag: 'Foundational Textbook'
      }
    ]
  },
  'file systems vs dbms': {
    conceptual: {
      quick: 'A DBMS is an integrated software suite managing structured concurrent data with ACID guarantees, whereas a file system merely persists byte streams with minimal integrity checks.',
      standard: 'Traditional file systems rely on the OS to read and write files directly. This leads to data redundancy, inconsistent updates across concurrent applications, lack of atomic transactions, and complex programmatic data retrieval. A Database Management System (DBMS) abstracts storage, enforces schemas, guarantees ACID transactions, and provides declarative querying via SQL.',
      deep: 'Under file systems, each application implements its own parsing, concurrency control, and recovery logic. In contrast, a DBMS contains a buffer manager, query optimizer, lock manager, and write-ahead log (WAL). This separation allows physical and logical data independence, multi-user isolation levels, and fail-safe crash recovery.',
      expert: 'Formal trade-offs: File systems minimize metadata overhead for raw sequential bulk I/O (e.g. video streaming, log aggregation). DBMS architectures introduce page buffer management (slotted page layouts, B+ Tree indexes) to achieve predictable O(log N) random access and strict serializability schedules under concurrent write workloads.',
      whatIsIt: 'A foundational comparison between raw OS file storage and structured database management engines.',
      whyExists: 'To solve critical concurrency, integrity, and redundancy failures that arise when scaling multi-user applications on raw files.',
      problemSolved: 'Eliminates data inconsistency, atomic update failures, and tedious low-level file I/O programming.',
      keyTakeaway: 'File systems store raw files; DBMS engines govern relationships, concurrent transactions, and declarative data guarantees.'
    },
    interactive: {
      fillBlank: {
        question: 'Identify the key differentiator:',
        preText: 'Unlike raw file systems, a modern DBMS provides',
        missingWord: 'ACID guarantees',
        postText: 'to prevent corrupt states during power failures or concurrent updates.',
        options: ['ACID guarantees', 'sequential disk access', 'lossless video compression', 'raw inode pointers'],
        hint: 'Think of Atomicity, Consistency, Isolation, and Durability.',
        explanation: 'ACID properties are the cornerstone of relational database transactions, something file systems do not inherently guarantee.'
      },
      matching: [
        { id: 'm1', term: 'Data Redundancy', definition: 'Same data duplicated across multiple separate files causing sync anomalies' },
        { id: 'm2', term: 'Data Independence', definition: 'Immunity of user applications to changes in physical storage or schema structures' },
        { id: 'm3', term: 'Concurrent Access Anomalies', definition: 'Race conditions occurring when multiple processes write to identical records simultaneously' },
        { id: 'm4', term: 'Atomicity', definition: 'Ensuring an operation sequence executes completely or aborts leaving no partial state' }
      ],
      ordering: {
        title: 'Evolution of Data Storage Architecture',
        instruction: 'Order the architectural milestones from earliest to modern standard:',
        items: [
          { id: 'o1', text: 'Flat file storage without cross-file schemas', correctOrder: 1 },
          { id: 'o2', text: 'Hierarchical & Network database models (CODASYL)', correctOrder: 2 },
          { id: 'o3', text: 'Relational Model and declarative SQL (Codd & System R)', correctOrder: 3 },
          { id: 'o4', text: 'Distributed ACID and NewSQL hybrid engines', correctOrder: 4 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        'File systems lack built-in granular locking; locking an entire file blocks all other readers or writers.',
        'DBMS engines utilize Write-Ahead Logging (WAL) to ensure dirty pages in the memory buffer can be reconstructed after power loss.',
        'Data independence is split into Logical (schema evolution without altering views) and Physical (storage hardware changes without altering schemas).'
      ],
      comparisonTable: {
        title: 'File System vs DBMS Technical Comparison',
        headers: ['Feature', 'OS File System', 'Relational DBMS'],
        rows: [
          ['Data Redundancy', 'High; duplicated across program files', 'Minimized through normalization'],
          ['Concurrency Control', 'Crude OS file locks', 'Granular row/page 2PL and MVCC'],
          ['Crash Recovery', 'Manual file scans (fsck)', 'Automatic via Write-Ahead Log (WAL)'],
          ['Query Language', 'Custom app code (grep, awk, C/Python)', 'Declarative SQL with Cost-Based Optimizer']
        ]
      },
      commonPitfalls: [
        'Assuming a DBMS is always faster: for simple single-file append-only logging, file systems can outperform due to zero query overhead.',
        'Confusing file permission security with database-level role-based column/row access control.'
      ],
      mentalModelOrMnemonic: 'Mnemonic: "Files give raw storage; DBMS gives Structured Guarantees (ACID)."'
    },
    hardQuiz: [
      {
        id: 'q1',
        question: 'Two users attempt to book the last available flight seat simultaneously. Which DBMS mechanism guarantees only one booking succeeds without corrupting state?',
        options: ['ACID Concurrency Control & Isolation', 'OS File Lock on the disk sector', 'Buffer Pool replacement algorithm', 'Data Encryption Standard'],
        correctIndex: 0,
        category: 'application',
        explanation: 'Isolation protocols (such as Two-Phase Locking or Snapshot Isolation) serialize concurrent updates to prevent lost updates or double bookings.'
      },
      {
        id: 'q2',
        question: 'Which of the following is an example of Physical Data Independence in a DBMS?',
        options: [
          'Switching table storage from row-oriented heap to a clustered B+ tree without rewriting SQL queries',
          'Adding a new column to an existing table without notifying users',
          'Exporting database tables to CSV files',
          'Renaming user accounts in the authorization dictionary'
        ],
        correctIndex: 0,
        category: 'conceptual',
        explanation: 'Physical data independence means the internal storage structure or indexing can change without modifying logical schema queries.'
      },
      {
        id: 'q3',
        question: 'What is the primary vulnerability of storing banking transaction logs directly in unmanaged flat OS files?',
        options: [
          'Partial writes during a power outage create corrupted, non-atomic half-states',
          'File systems cannot store numbers larger than 32 bits',
          'Flat files cannot be read across local networks',
          'OS kernels do not support text encoding'
        ],
        correctIndex: 0,
        category: 'recall',
        explanation: 'Without transactional write-ahead logging (WAL), crash during a write leaves inconsistent or unrecoverable bytes.'
      },
      {
        id: 'q4',
        question: 'How does a DBMS buffer manager differ from the operating system page cache?',
        options: [
          'The DBMS buffer manager has domain knowledge of query plans, dirty pages, and WAL flush ordering (force/no-steal policies)',
          'The OS page cache can only read 1 byte at a time',
          'The DBMS buffer manager bypasses physical RAM entirely',
          'There is no difference; they are identical abstractions'
        ],
        correctIndex: 0,
        category: 'differentiation',
        explanation: 'A DBMS must strictly coordinate buffer pool flushes with the WAL protocol before writing dirty pages to disk, which general-purpose OS page caches do not understand.'
      },
      {
        id: 'q5',
        question: 'Under what scenario is a standard OS file system objectively preferable to spinning up a full relational DBMS?',
        options: [
          'Streaming high-throughput unindexed sequential binary video assets or raw immutable sensor blobs',
          'Managing bank balances with concurrent transfers',
          'Running multi-table relational joins with foreign keys',
          'Managing inventory with frequent real-time updates'
        ],
        correctIndex: 0,
        category: 'application',
        explanation: 'Sequential binary media streams benefit from raw OS disk block streaming without DBMS transactional or relational engine overhead.'
      }
    ],
    externalResources: [
      {
        type: 'video',
        title: 'Database Systems Architecture: File Systems vs DBMS',
        source: 'CMU Database Group (YouTube)',
        description: 'Lecture on disk storage, buffer pools, and relational invariants by Andy Pavlo.',
        url: 'https://www.youtube.com/results?search_query=cmu+database+systems+file+system+vs+dbms',
        tag: 'University Lecture'
      },
      {
        type: 'article',
        title: 'Architecture of a Database System',
        source: 'Foundations and Trends in Databases (Hellerstein & Stonebraker)',
        description: 'The landmark paper detailing why DBMS storage engines differ from OS files.',
        url: 'https://en.wikipedia.org/wiki/Database',
        tag: 'Seminal Literature'
      },
      {
        type: 'reference',
        title: 'Stanford CS145 Introduction to Databases',
        source: 'Stanford University Online',
        description: 'Formal course notes on data independence, schemas, and relational guarantees.',
        url: 'https://web.stanford.edu/class/cs145/',
        tag: 'Academic Syllabus'
      }
    ]
  },

  'three-schema architecture & data independence': {
    conceptual: {
      quick: 'The ANSI/SPARC Three-Schema Architecture partitions a database into External (views), Conceptual (logical schema), and Internal (physical storage) layers to ensure data independence.',
      standard: 'To prevent application code from breaking whenever storage formats or database layouts change, the Three-Schema Architecture separates the database into three levels: 1) External Level describes end-user views; 2) Conceptual Level defines all entities, relationships, constraints, and tables; 3) Internal Level governs physical file organization, indexes, compression, and page layouts.',
      deep: 'Mappings between schemas bridge these layers. External/Conceptual mapping translates user view queries into operations on logical tables. Conceptual/Internal mapping translates logical table operations into disk block accesses and index traversals. If physical storage alters (e.g., adding an index or partitioning a table), only the Conceptual/Internal mapping changes, leaving user queries unaffected (Physical Data Independence).',
      expert: 'Formal mappings: A user view V_i is defined as a view expression over conceptual relations R. When physical indexing π changes, the optimizer adjusts physical execution operators without altering schema signature Σ. Logical data independence is more difficult to achieve because changing conceptual relations (e.g., splitting a table) often requires updating view definitions.',
      whatIsIt: 'The canonical ANSI/SPARC 3-tier database framework establishing clear boundaries between user views, business logic, and disk storage.',
      whyExists: 'To decouple client applications from underlying database schema reorganizations and physical storage upgrades.',
      problemSolved: 'Eliminates costly application rewrites when database administrators optimize indexes, partition tables, or alter underlying hardware.',
      keyTakeaway: 'External = Views, Conceptual = Tables & Rules, Internal = Blocks & Indexes.'
    },
    interactive: {
      fillBlank: {
        question: 'Identify the level of independence:',
        preText: 'The capacity to alter the conceptual schema without having to rewrite external views or application programs is known as',
        missingWord: 'Logical Data Independence',
        postText: '.',
        options: ['Logical Data Independence', 'Physical Data Independence', 'Hardware Virtualization', 'Atomicity'],
        hint: 'It deals with the conceptual/logical level of schemas.',
        explanation: 'Logical Data Independence allows altering the conceptual schema (e.g. adding columns or tables) while maintaining existing user views.'
      },
      matching: [
        { id: 'm1', term: 'External Level', definition: 'Tailored views exposed to specific user groups or applications' },
        { id: 'm2', term: 'Conceptual Level', definition: 'The unified logical structure of the entire database including all entities and constraints' },
        { id: 'm3', term: 'Internal Level', definition: 'The physical implementation details such as B-Trees, page layouts, and record allocations' },
        { id: 'm4', term: 'Physical Independence', definition: 'Altering internal storage without impacting conceptual schemas or external views' }
      ],
      ordering: {
        title: 'ANSI/SPARC Query Resolution Hierarchy',
        instruction: 'Trace a student query from the user down to physical storage blocks:',
        items: [
          { id: 'o1', text: 'User executes query against External View', correctOrder: 1 },
          { id: 'o2', text: 'DBMS translates query via External-Conceptual mapping into logical schema terms', correctOrder: 2 },
          { id: 'o3', text: 'DBMS evaluates Conceptual-Internal mapping to determine index traversals and page reads', correctOrder: 3 },
          { id: 'o4', text: 'Storage Engine retrieves physical disk blocks into Buffer Pool RAM', correctOrder: 4 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        'Physical data independence is standard in virtually all modern relational databases (adding an index never breaks existing SELECT queries).',
        'Logical data independence is harder to achieve because significant conceptual restructuring (e.g., splitting a table into two) may require complex updatable views.',
        'Views in SQL (CREATE VIEW) are the concrete implementation of the External Level.'
      ],
      comparisonTable: {
        title: 'Three Schema Levels Matrix',
        headers: ['Level', 'Audience', 'What It Defines', 'Example SQL Construct'],
        rows: [
          ['External', 'End Users & Apps', 'Individual customized views', 'CREATE VIEW active_students AS...'],
          ['Conceptual', 'DBA & Developers', 'Complete logical model & constraints', 'CREATE TABLE students (id INT PRIMARY KEY...)'],
          ['Internal', 'Storage Engine', 'Data layout, indexing, clustering', 'CREATE INDEX idx_stu ON students USING btree...']
        ]
      },
      commonPitfalls: [
        'Confusing Logical with Physical Independence: Physical refers to disk/index changes; Logical refers to schema/table structure changes.',
        'Assuming views store duplicated data: Standard views are virtual queries expanded at runtime, not independent tables.'
      ],
      mentalModelOrMnemonic: 'Mnemonic: "E-C-I: Eyes see External, Core is Conceptual, Inside is Internal."'
    },
    hardQuiz: [
      {
        id: 'q1',
        question: 'A database administrator builds a composite B+ Tree index on (last_name, first_name) to accelerate search queries. No application code or queries are modified. What principle is demonstrated?',
        options: ['Physical Data Independence', 'Logical Data Independence', 'ACID Atomicity', 'View Materialization'],
        correctIndex: 0,
        category: 'conceptual',
        explanation: 'Creating, dropping, or altering indexes modifies only the Internal storage level, exemplifying physical data independence.'
      },
      {
        id: 'q2',
        question: 'A company splits a single Employee table into EmployeePersonal and EmployeeJobDetails tables, but creates an updatable view with the old schema name so existing apps run without changes. What does this demonstrate?',
        options: ['Logical Data Independence', 'Physical Data Independence', 'Deadlock Detection', 'Physical De-clustering'],
        correctIndex: 0,
        category: 'differentiation',
        explanation: 'Changing the conceptual schema (splitting tables) while preserving the external interface via a view is the definition of Logical Data Independence.'
      },
      {
        id: 'q3',
        question: 'Which of the three ANSI/SPARC schema levels is closest to physical computer hardware?',
        options: ['Internal Schema', 'Conceptual Schema', 'External Schema', 'Network Schema'],
        correctIndex: 0,
        category: 'recall',
        explanation: 'The Internal Schema directly describes record layouts, page organizations, indexing methods, and compression on disk.'
      },
      {
        id: 'q4',
        question: 'Why is Logical Data Independence generally more difficult to fully realize than Physical Data Independence?',
        options: [
          'Because modifying conceptual structures often invalidates write operations (INSERT/UPDATE/DELETE) through complex multi-table views',
          'Because disk drives cannot be upgraded without reformatting',
          'Because SQL does not support views',
          'Because foreign keys are prohibited in modern databases'
        ],
        correctIndex: 0,
        category: 'application',
        explanation: 'Updating decomposed conceptual tables through an external view often triggers ambiguity (non-updatable view problem in relational theory).'
      },
      {
        id: 'q5',
        question: 'Which component in the DBMS handles the transformation of a user query written on an external view into the physical storage operations?',
        options: [
          'The Query Parser, Rewriter, and Optimizer via Schema Mappings',
          'The Operating System Kernel Scheduler',
          'The Network Router',
          'The Hardware RAID controller'
        ],
        correctIndex: 0,
        category: 'application',
        explanation: 'The DBMS query processor rewrites view queries using catalog schema mappings, then selects the optimal physical access path.'
      }
    ],
    externalResources: [
      {
        type: 'video',
        title: 'Three-Schema Architecture and Data Independence',
        source: 'NPTEL Computer Science (YouTube)',
        description: 'Comprehensive academic explanation of the ANSI/SPARC framework and mapping mechanisms.',
        url: 'https://www.youtube.com/results?search_query=three+schema+architecture+dbms+lecture',
        tag: 'Core Academic Theory'
      },
      {
        type: 'article',
        title: 'ANSI/SPARC Architecture Overview',
        source: 'Wikipedia & Database Research',
        description: 'Historical context and architectural implications of three-level data abstraction.',
        url: 'https://en.wikipedia.org/wiki/ANSI-SPARC_Architecture',
        tag: 'Reference Article'
      },
      {
        type: 'reference',
        title: 'Database System Concepts (Silberschatz, Korth, Sudarshan)',
        source: 'McGraw-Hill Education',
        description: 'Chapter 1: Data Abstraction and Schema Architectures.',
        url: 'https://www.db-book.com/',
        tag: 'Foundational Textbook'
      }
    ]
  }
};

// Generic parametric educational content generator for any subject or topic
export function generateDynamicSubtopicContent(
  courseName: string,
  topicTitle: string,
  subtopicTitle: string,
  existingClarity: number = 50
): FallbackSubtopicContent {
  const normalizedKey = subtopicTitle.trim().toLowerCase();

  // Check if curated topic exists
  for (const [key, content] of Object.entries(curatedLibrary)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return {
        ...content,
        conceptual: {
          ...content.conceptual!,
        },
        interactive: {
          ...content.interactive!,
        },
        deepRevision: {
          ...content.deepRevision!,
        },
        hardQuiz: [...content.hardQuiz!],
        externalResources: [...content.externalResources!]
      } as FallbackSubtopicContent;
    }
  }

  // Synthesize domain-aware educational packet
  return {
    conceptual: {
      quick: `${subtopicTitle} is a foundational concept in ${topicTitle} (${courseName}) that formalizes how systems structure and process data reliably.`,
      standard: `In ${courseName}, ${subtopicTitle} establishes the governing rules and operational mechanics for ${topicTitle}. It ensures that data remains consistent, operations are efficient, and boundary constraints are strictly enforced across all execution stages.`,
      deep: `At an architectural level, ${subtopicTitle} balances computational complexity against storage overhead. By enforcing invariants and rigorous preconditions, it prevents edge-case anomalies, minimizes race conditions, and provides deterministic outcomes in concurrent and distributed environments.`,
      expert: `Formal specification: Given system state S and operation pipeline P under ${courseName}, ${subtopicTitle} models the transition relation δ: S × I → S' such that all invariant assertions hold across arbitrary transaction interleavings and scale boundaries.`,
      whatIsIt: `The core principle governing structured behavior and invariants in ${subtopicTitle}.`,
      whyExists: `To eliminate inconsistencies, prevent cascading failures, and guarantee mathematical correctness in ${topicTitle}.`,
      problemSolved: `Solves ambiguity, data corruption, and inefficient access patterns in ${courseName}.`,
      keyTakeaway: `Master the invariants of ${subtopicTitle}: correctness precedes optimization.`
    },
    interactive: {
      fillBlank: {
        question: `Test your foundational grasp of ${subtopicTitle}:`,
        preText: `The primary guarantee enforced by ${subtopicTitle} in ${courseName} is`,
        missingWord: 'consistent state preservation',
        postText: `across all operations.`,
        options: ['consistent state preservation', 'unlimited memory allocation', 'asynchronous network bypass', 'hardware overclocking'],
        hint: `Think of maintaining system invariants and avoiding invalid states.`,
        explanation: `${subtopicTitle} is designed to ensure the system transitions exclusively between valid states without data corruption.`
      },
      matching: [
        { id: 'm1', term: `${subtopicTitle} Invariant`, definition: 'The non-negotiable rule that must remain true before and after every operation' },
        { id: 'm2', term: 'Precondition', definition: 'The prerequisite state required before applying this technique' },
        { id: 'm3', term: 'Edge Case Scenario', definition: 'A boundary condition where naive implementations typically fail' },
        { id: 'm4', term: 'Optimization Strategy', definition: 'An architectural refinement that reduces time or space complexity' }
      ],
      ordering: {
        title: `${subtopicTitle} Workflow Execution`,
        instruction: 'Arrange the sequential phases in standard execution order:',
        items: [
          { id: 'o1', text: 'Initialization and verification of baseline preconditions', correctOrder: 1 },
          { id: 'o2', text: 'Evaluating transformation rules and dependency mappings', correctOrder: 2 },
          { id: 'o3', text: 'Executing core operation while logging transition states', correctOrder: 3 },
          { id: 'o4', text: 'Commit phase and verification of postcondition invariants', correctOrder: 4 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        `Key Principle 1: Always verify that input structures adhere to the formal definition of ${subtopicTitle} before initiating transformations.`,
        `Key Principle 2: Beware of hidden boundary conditions where null values or empty partitions alter expected behavior.`,
        `Key Principle 3: Optimization should never compromise the invariant guarantees established by ${subtopicTitle}.`
      ],
      comparisonTable: {
        title: `${subtopicTitle} vs Alternative Paradigms`,
        headers: ['Dimension', `${subtopicTitle}`, 'Naive Alternative', 'Impact on System'],
        rows: [
          ['Invariants', 'Formally verified', 'Ad-hoc assumptions', 'Zero corruption vs high anomaly rate'],
          ['Complexity', 'Optimized O(log N) or O(N)', 'Unbounded O(N²)', 'High scalability vs bottleneck'],
          ['Maintainability', 'Modular and decoupled', 'Tightly coupled monolithic', 'Clean evolution vs fragility']
        ]
      },
      commonPitfalls: [
        `Confusing the formal definition of ${subtopicTitle} with its specific vendor-dependent implementation.`,
        `Overlooking boundary conditions when scaling data volume by orders of magnitude.`
      ],
      mentalModelOrMnemonic: `Mnemonic: "Verify preconditions first, preserve invariants always, optimize thoughtfully."`
    },
    hardQuiz: [
      {
        id: 'q1',
        question: `What is the primary architectural purpose of ${subtopicTitle} within ${topicTitle}?`,
        options: [
          `To enforce rigorous correctness and structural invariants across operations`,
          `To bypass operating system security protocols`,
          `To eliminate the need for persistent disk storage`,
          `To compile source code into machine binary`
        ],
        correctIndex: 0,
        category: 'conceptual',
        explanation: `${subtopicTitle} serves fundamentally to guarantee correctness, integrity, and predictable operational behavior.`
      },
      {
        id: 'q2',
        question: `Under what circumstance would a system architect encounter a failure in ${subtopicTitle}?`,
        options: [
          `When preconditions are violated or concurrent updates violate isolation boundaries`,
          `When the system has excessive available RAM`,
          `When queries are written in uppercase characters`,
          `When network latency is 0 milliseconds`
        ],
        correctIndex: 0,
        category: 'differentiation',
        explanation: 'Failures in formal data mechanics arise when boundary invariants or concurrency preconditions are violated.'
      },
      {
        id: 'q3',
        question: `Which metric provides the most accurate indicator of mastery for ${subtopicTitle}?`,
        options: [
          `Ability to correctly identify edge-case boundary conditions and prevent anomalies`,
          `Speed of typing SQL or code keywords`,
          `Memorization of arbitrary version release numbers`,
          `Total lines of documentation generated`
        ],
        correctIndex: 0,
        category: 'recall',
        explanation: 'True conceptual clarity is demonstrated by recognizing subtle edge cases and explaining why boundary rules exist.'
      },
      {
        id: 'q4',
        question: `In a production environment encountering high throughput, how does ${subtopicTitle} scale?`,
        options: [
          `Through structured indexing, partitioning, and adherence to mathematical invariants`,
          `By disabling all data validation checks permanently`,
          `By deleting historic transactional logs indiscriminately`,
          `By replacing relational models with unstructured text dumps`
        ],
        correctIndex: 0,
        category: 'application',
        explanation: 'Scalability is achieved through principled indexing, partitioning, and disciplined invariant maintenance.'
      },
      {
        id: 'q5',
        question: `What distinguishes ${subtopicTitle} from more simplistic, unmanaged approaches in ${courseName}?`,
        options: [
          `Predictable deterministic guarantees and formal dependency preservation`,
          `Higher random failure rates`,
          `Total lack of schema definitions`,
          `Incompatibility with modern hardware`
        ],
        correctIndex: 0,
        category: 'differentiation',
        explanation: 'Systematic discipline, formal guarantees, and predictable outcomes are the defining attributes.'
      }
    ],
    externalResources: [
      {
        type: 'video',
        title: `Comprehensive Guide to ${subtopicTitle}`,
        source: `${courseName} Academy (YouTube)`,
        description: `Visual walkthrough and step-by-step breakdown of ${subtopicTitle}.`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subtopicTitle + ' ' + courseName)}`,
        tag: 'Recommended Video'
      },
      {
        type: 'article',
        title: `Technical Deep Dive: ${subtopicTitle}`,
        source: 'ACM Computer Science Repository',
        description: `Authoritative theoretical breakdown of ${subtopicTitle} and system trade-offs.`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(subtopicTitle)}`,
        tag: 'Core Reference'
      },
      {
        type: 'reference',
        title: `${courseName} University Curriculum Standards`,
        source: 'Computer Science Curricula 2026',
        description: `Formal specifications and syllabus guidelines for ${topicTitle}.`,
        url: 'https://web.stanford.edu/class/cs145/',
        tag: 'Academic Syllabus'
      }
    ]
  };
}

// Fallback syllabus generator with multi-subject curriculum support and syllabus text parsing
export function generateFallbackSyllabus(
  courseName: string,
  _durationDays: number = 30,
  syllabusText?: string
) {
  const cName = courseName ? courseName.trim() : 'Operating Systems';
  const cLower = cName.toLowerCase();
  const sLower = (syllabusText || '').toLowerCase();

  // 1. If syllabus text has explicit structured units (e.g. Unit 1: ..., Unit 2: ... or Module 1: ...)
  if (syllabusText && syllabusText.trim().length > 15) {
    const unitMatches = Array.from(syllabusText.matchAll(/(?:Unit|Module|Chapter|Topic)\s*(\d+)[:\-\.\s]+([^\n\r.]+)/gi));
    if (unitMatches.length >= 2) {
      const parsedTopics = unitMatches.map((match, idx) => {
        const title = match[2].trim();
        const baseId = `top-${Date.now()}-${idx + 1}`;
        return {
          id: baseId,
          title: `Unit ${match[1] || idx + 1}: ${title}`,
          order: idx + 1,
          isCompleted: idx === 0,
          isLocked: false,
          subtopics: [
            {
              id: `sub-${Date.now()}-${idx + 1}-1`,
              title: `${title} - Core Architecture & Theory`,
              order: 1,
              isCompleted: idx === 0,
              isLocked: false,
              clarityScore: idx === 0 ? 80 : 0,
              daysUntilRevision: idx === 0 ? 7 : 0,
              estimatedRetention: idx === 0 ? 85 : 0,
            },
            {
              id: `sub-${Date.now()}-${idx + 1}-2`,
              title: `${title} - Algorithms & Implementation`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 0,
              estimatedRetention: 0,
            },
          ],
        };
      });
      return { topics: parsedTopics };
    }
  }

  // 2. Exact Operating Systems Curriculum per specification
  if (cLower.includes('operat') || cLower.includes('os') || sLower.includes('process management') || sLower.includes('banker')) {
    return {
      topics: [
        {
          id: `top-os-1`,
          title: `Unit 1: Process Management & CPU Scheduling`,
          order: 1,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-os-1-1`,
              title: `Process Concept, States & PCB`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-os-1-2`,
              title: `CPU Scheduling Algorithms (FCFS, SJF, Round Robin)`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
        {
          id: `top-os-2`,
          title: `Unit 2: Threads & Concurrency`,
          order: 2,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-os-2-1`,
              title: `Thread Models & Multithreading`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-os-2-2`,
              title: `Race Conditions, Mutexes & Semaphores`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
        {
          id: `top-os-3`,
          title: `Unit 3: Deadlocks & Bankers Algorithm`,
          order: 3,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-os-3-1`,
              title: `Deadlock Characterization & Prevention`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-os-3-2`,
              title: `Banker's Algorithm & Resource Allocation Graph`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
        {
          id: `top-os-4`,
          title: `Unit 4: Virtual Memory & Paging`,
          order: 4,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-os-4-1`,
              title: `Address Translation, Paging & TLB`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-os-4-2`,
              title: `Page Faults & Replacement Algorithms (LRU, Clock)`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
        {
          id: `top-os-5`,
          title: `Unit 5: File Systems & I/O Systems`,
          order: 5,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-os-5-1`,
              title: `Inodes, File Allocation Methods & Directories`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-os-5-2`,
              title: `Disk Scheduling (SSTF, SCAN) & I/O Systems`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
      ],
    };
  }

  // 3. Database Management Systems Curriculum
  if (cLower.includes('dbms') || cLower.includes('database')) {
    return {
      topics: [
        {
          id: `top-db-1`,
          title: `Unit 1: Relational Model & SQL Fundamentals`,
          order: 1,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-db-1-1`,
              title: `Relational Integrity Constraints & Keys`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-db-1-2`,
              title: `SQL Joins (Inner, Left, Right, Full Outer & Natural)`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
        {
          id: `top-db-2`,
          title: `Unit 2: Relational Schema Normalization`,
          order: 2,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-db-2-1`,
              title: `Third Normal Form (3NF) & Transitive Dependencies`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-db-2-2`,
              title: `Boyce-Codd Normal Form (BCNF) & Lossless Joins`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
        {
          id: `top-db-3`,
          title: `Unit 3: Transactions, Concurrency & Recovery`,
          order: 3,
          isCompleted: false,
          isLocked: false,
          subtopics: [
            {
              id: `sub-db-3-1`,
              title: `ACID Invariants & Serializability Protocols`,
              order: 1,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
            {
              id: `sub-db-3-2`,
              title: `Two-Phase Locking (2PL) & Deadlock Handling`,
              order: 2,
              isCompleted: false,
              isLocked: false,
              clarityScore: 0,
              daysUntilRevision: 7,
              estimatedRetention: 100,
            },
          ],
        },
      ],
    };
  }

  // 4. Default Domain-Adaptive Syllabus
  return {
    topics: [
      {
        id: `top-${Date.now()}-1`,
        title: `Unit 1: Foundations & Core Principles of ${cName}`,
        order: 1,
        isCompleted: false,
        isLocked: false,
        subtopics: [
          {
            id: `sub-${Date.now()}-1-1`,
            title: `Introduction & Foundational Architecture`,
            order: 1,
            isCompleted: false,
            isLocked: false,
            clarityScore: 0,
            daysUntilRevision: 7,
            estimatedRetention: 100,
          },
          {
            id: `sub-${Date.now()}-1-2`,
            title: `Structural Models & Invariants`,
            order: 2,
            isCompleted: false,
            isLocked: false,
            clarityScore: 0,
            daysUntilRevision: 7,
            estimatedRetention: 100,
          },
        ],
      },
      {
        id: `top-${Date.now()}-2`,
        title: `Unit 2: Advanced Operations & Systems in ${cName}`,
        order: 2,
        isCompleted: false,
        isLocked: false,
        subtopics: [
          {
            id: `sub-${Date.now()}-2-1`,
            title: `Operational Protocols & Performance`,
            order: 1,
            isCompleted: false,
            isLocked: false,
            clarityScore: 0,
            daysUntilRevision: 7,
            estimatedRetention: 100,
          },
          {
            id: `sub-${Date.now()}-2-2`,
            title: `Applied Problem Solving & Optimization`,
            order: 2,
            isCompleted: false,
            isLocked: false,
            clarityScore: 0,
            daysUntilRevision: 7,
            estimatedRetention: 100,
          },
        ],
      },
    ],
  };
}
