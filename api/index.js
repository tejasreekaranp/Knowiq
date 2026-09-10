// src/server/app.ts
import express from "express";
import dotenv2 from "dotenv";

// src/server/contentGenerator.ts
var curatedLibrary = {
  "process concept, states & pcb": {
    conceptual: {
      quick: "A process is an active program in execution, managed via a Process Control Block (PCB) tracking state, PC, registers, and memory boundaries.",
      standard: "In modern operating systems, a process is the core abstraction for executing programs. It encapsulates the code (text section), current activity represented by the Program Counter and processor registers, a call stack for function parameters and local variables, and a heap for dynamically allocated memory. The OS tracks each process via a Process Control Block (PCB).",
      deep: "The Process Control Block (PCB) acts as the operational manifest: it stores the unique PID, process state (New, Ready, Running, Waiting, Terminated), CPU registers, CPU scheduling priority, memory-management information (base/limit registers or page tables), accounting information, and I/O status. When switching between processes, the kernel performs a context switch: saving current hardware registers into the old PCB and restoring the state of the newly scheduled PCB.",
      expert: "Context switch latency is pure computational overhead where no useful user work occurs. The kernel executes privileged routines to flush or invalidate TLBs (unless tagged with Address Space Identifiers / ASIDs), switch page directory base registers (CR3 in x86_64), and reload task registers, with typical latency ranging from fractions of a microsecond to several microseconds depending on memory hierarchy penalties.",
      whatIsIt: "The foundational abstraction of a running program and its kernel tracking data structure (PCB).",
      whyExists: "To provide safe resource isolation, virtualized CPU access, and deterministic multitasking among concurrent programs.",
      problemSolved: "Eliminates uncoordinated hardware access and prevents rogue programs from corrupting physical memory.",
      keyTakeaway: "A process is an active program in execution; the Process Control Block (PCB) is the kernel manifest storing its entire CPU context."
    },
    interactive: {
      fillBlank: {
        question: "Identify the kernel tracking structure:",
        preText: "The operating system kernel maintains all state, register values, and scheduling metadata for an active process inside the",
        missingWord: "Process Control Block",
        postText: "data structure.",
        options: ["Process Control Block", "Memory Management Unit", "Interrupt Vector Table", "File Allocation Table"],
        hint: "Also known as task_struct in the Linux kernel.",
        explanation: "The Process Control Block (PCB or task_struct in Linux) is the kernel data structure maintaining the entire execution context of a process."
      },
      matching: [
        { id: "m-pcb-1", term: "Ready State", definition: "Process is in memory awaiting CPU core assignment from the scheduler" },
        { id: "m-pcb-2", term: "Running State", definition: "Process instructions are currently being executed by the CPU" },
        { id: "m-pcb-3", term: "Waiting (Blocked) State", definition: "Process cannot execute until an external I/O event or signal completes" },
        { id: "m-pcb-4", term: "Terminated State", definition: "Process has finished execution and awaits PCB cleanup by its parent" }
      ],
      ordering: {
        title: "Context Switch Execution Sequence",
        instruction: "Order the kernel events during a preemptive process context switch:",
        items: [
          { id: "seq-1", text: "Hardware timer interrupt triggers kernel interrupt service routine", correctOrder: 1 },
          { id: "seq-2", text: "Current register context saved into current process PCB", correctOrder: 2 },
          { id: "seq-3", text: "Process state changed from Running to Ready and queued", correctOrder: 3 },
          { id: "seq-4", text: "CPU scheduler algorithm picks next highest-priority ready process", correctOrder: 4 },
          { id: "seq-5", text: "Hardware registers restored from new process PCB and PC dispatched", correctOrder: 5 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        "A process includes code, data, heap, and stack; a context switch requires saving and restoring register state.",
        "The PCB represents the process to the OS. Linux uses task_struct defined in <linux/sched.h>.",
        "State transitions: New -> Ready -> Running -> Waiting (for I/O) or Terminated."
      ],
      comparisonTable: {
        title: "Process vs Thread System Trade-offs",
        headers: ["Dimension", "Process", "Thread"],
        rows: [
          ["Address Space", "Isolated virtual memory", "Shares parent virtual memory"],
          ["Context Switch Overhead", "High (CR3 register switch, TLB flush)", "Low (registers & stack pointer only)"],
          ["Fault Isolation", "Total; crash does not affect other processes", "Low; memory corruption affects entire process"]
        ]
      },
      commonPitfalls: [
        "Assuming context switches are free: TLB invalidation causes severe cache miss storms on re-entry.",
        "Allowing zombie processes to accumulate by not calling wait() or handling SIGCHLD."
      ],
      mentalModelOrMnemonic: 'Mnemonic: "A program is a recipe on disk; a process is the cook actively executing it in the kitchen."'
    },
    hardQuiz: [
      {
        id: "os-pcb-1",
        question: "Which of the following events strictly requires a transition to the Waiting (Blocked) state rather than Ready?",
        options: [
          "Synchronous read() system call awaiting disk block arrival",
          "Expiration of the CPU time slice quantum",
          "Preemption by a higher-priority real-time process",
          "Arrival of an unmasked hardware timer interrupt"
        ],
        correctIndex: 0,
        category: "conceptual",
        explanation: "Synchronous I/O operations cannot proceed until hardware completes the transfer, requiring a transition to Waiting. Timer expiration and preemption leave the process ready to run immediately."
      },
      {
        id: "os-pcb-2",
        question: "What is the primary architectural overhead associated with a context switch between two different processes compared to two threads in the same process?",
        options: [
          "Flushing/invalidation of the Translation Lookaside Buffer (TLB) and virtual address space reassignment",
          "Saving general-purpose integer registers %rax through %rdx",
          "Updating the kernel tick counter",
          "Clearing the program counter to 0x0"
        ],
        correctIndex: 0,
        category: "differentiation",
        explanation: "Processes have independent virtual address spaces. Switching processes requires changing the page table pointer (e.g., CR3 register), which invalidates the TLB unless PCID/ASIDs are supported."
      },
      {
        id: "os-pcb-3",
        question: "A process that has finished execution via exit() but whose parent process has not yet invoked wait() is known as:",
        options: [
          "A Zombie process",
          "An Orphan process",
          "A Daemon process",
          "A Deadlock process"
        ],
        correctIndex: 0,
        category: "recall",
        explanation: "A zombie process has terminated and released its memory, but retains an entry in the process table so its parent can read its exit status code."
      }
    ],
    externalResources: [
      {
        type: "reference",
        title: "Operating Systems: Three Easy Pieces (OSTEP) - Virtualization & Processes",
        source: "Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau (University of Wisconsin-Madison)",
        description: "Chapter 4: The Abstraction: The Process and Context Switching Mechanics.",
        url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf",
        tag: "Foundational Textbook"
      },
      {
        type: "video",
        title: "MIT 6.S081: Operating System Engineering - Processes and Isolation",
        source: "MIT OpenCourseWare (YouTube)",
        description: "In-depth lecture on kernel process isolation, context switching, and trap handling in xv6.",
        url: "https://www.youtube.com/results?search_query=MIT+6.S081+processes+context+switch",
        tag: "Academic Lecture"
      }
    ]
  },
  "cpu scheduling algorithms": {
    conceptual: {
      quick: "CPU scheduling algorithms decide which process in the ready queue receives CPU time to optimize turnaround, response time, and fairness.",
      standard: "The CPU scheduler is the kernel subsystem responsible for allocating processor cores among ready processes. Algorithms range from non-preemptive approaches (FCFS, Non-preemptive SJF) to preemptive algorithms (Round Robin, Shortest Remaining Time First, and Multilevel Feedback Queues). Key performance metrics include CPU utilization, throughput, turnaround time, waiting time, and response time.",
      deep: "Preemptive scheduling enables the kernel to interrupt a running process when a higher-priority task arrives or when the allocated time quantum expires. The Multilevel Feedback Queue (MLFQ) solves the challenge of optimizing both turnaround time for long batch jobs and response time for interactive I/O-bound jobs without prior knowledge of execution bursts.",
      expert: "Modern kernels like Linux use the Completely Fair Scheduler (CFS). CFS models an ideal multi-tasking CPU using a red-black tree indexed by virtual runtime (vruntime). The process that has received the least CPU time (minimum vruntime) is dispatched next, with process priorities mapped to nice values weighting the accumulation rate of vruntime.",
      whatIsIt: "Algorithmic policies for allocating CPU cores among competing ready processes.",
      whyExists: "To maximize CPU throughput, minimize interactive latency, and prevent starvation.",
      problemSolved: "Resolves CPU contention and avoids unfair execution bottlenecks.",
      keyTakeaway: "CPU scheduling governs processor allocation to maximize throughput and responsiveness."
    },
    interactive: {
      fillBlank: {
        question: "Identify the scheduling parameter:",
        preText: "In Round Robin scheduling, the fixed slice of processor time assigned to each process is called the",
        missingWord: "Time Quantum",
        postText: "before preemption occurs.",
        options: ["Time Quantum", "Context Interval", "Burst Threshold", "Priority Band"],
        hint: "Typically calibrated between 10ms and 100ms in interactive systems.",
        explanation: "The time quantum (or time slice) dictates how long a process can run before being preempted by the timer interrupt."
      },
      matching: [
        { id: "m-sched-1", term: "First-Come, First-Served (FCFS)", definition: "Non-preemptive algorithm susceptible to the convoy effect" },
        { id: "m-sched-2", term: "Shortest Job First (SJF)", definition: "Provably optimal average waiting time, requires burst time prediction" },
        { id: "m-sched-3", term: "Round Robin (RR)", definition: "Preemptive time-sliced policy designed for interactive response times" },
        { id: "m-sched-4", term: "Multilevel Feedback Queue", definition: "Dynamically adjusts process priority based on observed CPU/IO burst behavior" }
      ],
      ordering: {
        title: "Round Robin Dispatch Cycle",
        instruction: "Order the steps in a Round Robin scheduling time slice:",
        items: [
          { id: "seq-rr-1", text: "Process placed at tail of Ready Queue with initialized quantum", correctOrder: 1 },
          { id: "seq-rr-2", text: "CPU dispatched to process for execution", correctOrder: 2 },
          { id: "seq-rr-3", text: "Hardware timer interrupts upon quantum expiration", correctOrder: 3 },
          { id: "seq-rr-4", text: "Kernel context switches current process to tail of Ready Queue", correctOrder: 4 },
          { id: "seq-rr-5", text: "Head process of Ready Queue dispatched to CPU core", correctOrder: 5 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        "Scheduling goals: Maximize CPU utilization and throughput; minimize turnaround time, waiting time, and response time.",
        "SJF is optimal for average waiting time, but predicting future CPU burst lengths requires exponential smoothing.",
        "Round Robin performance heavily depends on the size of the time quantum relative to context switch latency."
      ],
      comparisonTable: {
        title: "CPU Scheduling Algorithm Comparison",
        headers: ["Algorithm", "Preemptive", "Primary Metric Favored", "Primary Drawback"],
        rows: [
          ["FCFS", "No", "Simplicity & Fairness", "Convoy effect halts short jobs"],
          ["SJF / SRTF", "Yes or No", "Average Waiting Time", "Starvation of long jobs"],
          ["Round Robin", "Yes", "Response Time", "High context switch overhead if quantum is too small"],
          ["Multilevel Feedback Queue", "Yes", "Adaptive Multi-objective", "Complex tuning of aging thresholds"]
        ]
      },
      commonPitfalls: [
        "Setting Round Robin time quantum too small: CPU spends 50%+ of cycles performing context switches.",
        "Unbounded priority queues without aging: Low-priority jobs starve indefinitely."
      ],
      mentalModelOrMnemonic: 'Mnemonic: "Round Robin is like speed dating for processes; everyone gets equal turns."'
    },
    hardQuiz: [
      {
        id: "os-sched-1",
        question: "Which scheduling algorithm is provably optimal in minimizing average waiting time for a given set of stationary processes?",
        options: [
          "Shortest Job First (SJF)",
          "First-Come, First-Served (FCFS)",
          "Round Robin with large quantum",
          "Priority scheduling without aging"
        ],
        correctIndex: 0,
        category: "conceptual",
        explanation: "Shortest Job First (SJF / Shortest Remaining Time First) is provably optimal for minimizing average waiting time by scheduling shorter bursts ahead of longer ones."
      },
      {
        id: "os-sched-2",
        question: "In a system running Round Robin scheduling, what is the consequence of making the time quantum infinitely large?",
        options: [
          "It degenerates into First-Come, First-Served (FCFS) scheduling",
          "It becomes equivalent to Shortest Job First",
          "Context switch overhead increases exponentially",
          "System response time approaches zero"
        ],
        correctIndex: 0,
        category: "differentiation",
        explanation: "If the time quantum exceeds the CPU burst of any process, no process is ever preempted by time slice expiration, behaving identically to FCFS."
      }
    ],
    externalResources: [
      {
        type: "reference",
        title: "Operating Systems: Three Easy Pieces - Scheduling Intro & MLFQ",
        source: "OSTEP Book",
        description: "Chapters 7, 8, 9: Complete breakdown of scheduling metrics, SJF, RR, and MLFQ.",
        url: "https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf",
        tag: "Foundational Textbook"
      }
    ]
  },
  "file systems vs dbms": {
    conceptual: {
      quick: "A DBMS is an integrated software suite managing structured concurrent data with ACID guarantees, whereas a file system merely persists byte streams with minimal integrity checks.",
      standard: "Traditional file systems rely on the OS to read and write files directly. This leads to data redundancy, inconsistent updates across concurrent applications, lack of atomic transactions, and complex programmatic data retrieval. A Database Management System (DBMS) abstracts storage, enforces schemas, guarantees ACID transactions, and provides declarative querying via SQL.",
      deep: "Under file systems, each application implements its own parsing, concurrency control, and recovery logic. In contrast, a DBMS contains a buffer manager, query optimizer, lock manager, and write-ahead log (WAL). This separation allows physical and logical data independence, multi-user isolation levels, and fail-safe crash recovery.",
      expert: "Formal trade-offs: File systems minimize metadata overhead for raw sequential bulk I/O (e.g. video streaming, log aggregation). DBMS architectures introduce page buffer management (slotted page layouts, B+ Tree indexes) to achieve predictable O(log N) random access and strict serializability schedules under concurrent write workloads.",
      whatIsIt: "A foundational comparison between raw OS file storage and structured database management engines.",
      whyExists: "To solve critical concurrency, integrity, and redundancy failures that arise when scaling multi-user applications on raw files.",
      problemSolved: "Eliminates data inconsistency, atomic update failures, and tedious low-level file I/O programming.",
      keyTakeaway: "File systems store raw files; DBMS engines govern relationships, concurrent transactions, and declarative data guarantees."
    },
    interactive: {
      fillBlank: {
        question: "Identify the key differentiator:",
        preText: "Unlike raw file systems, a modern DBMS provides",
        missingWord: "ACID guarantees",
        postText: "to prevent corrupt states during power failures or concurrent updates.",
        options: ["ACID guarantees", "sequential disk access", "lossless video compression", "raw inode pointers"],
        hint: "Think of Atomicity, Consistency, Isolation, and Durability.",
        explanation: "ACID properties are the cornerstone of relational database transactions, something file systems do not inherently guarantee."
      },
      matching: [
        { id: "m1", term: "Data Redundancy", definition: "Same data duplicated across multiple separate files causing sync anomalies" },
        { id: "m2", term: "Data Independence", definition: "Immunity of user applications to changes in physical storage or schema structures" },
        { id: "m3", term: "Concurrent Access Anomalies", definition: "Race conditions occurring when multiple processes write to identical records simultaneously" },
        { id: "m4", term: "Atomicity", definition: "Ensuring an operation sequence executes completely or aborts leaving no partial state" }
      ],
      ordering: {
        title: "Evolution of Data Storage Architecture",
        instruction: "Order the architectural milestones from earliest to modern standard:",
        items: [
          { id: "o1", text: "Flat file storage without cross-file schemas", correctOrder: 1 },
          { id: "o2", text: "Hierarchical & Network database models (CODASYL)", correctOrder: 2 },
          { id: "o3", text: "Relational Model and declarative SQL (Codd & System R)", correctOrder: 3 },
          { id: "o4", text: "Distributed ACID and NewSQL hybrid engines", correctOrder: 4 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        "File systems lack built-in granular locking; locking an entire file blocks all other readers or writers.",
        "DBMS engines utilize Write-Ahead Logging (WAL) to ensure dirty pages in the memory buffer can be reconstructed after power loss.",
        "Data independence is split into Logical (schema evolution without altering views) and Physical (storage hardware changes without altering schemas)."
      ],
      comparisonTable: {
        title: "File System vs DBMS Technical Comparison",
        headers: ["Feature", "OS File System", "Relational DBMS"],
        rows: [
          ["Data Redundancy", "High; duplicated across program files", "Minimized through normalization"],
          ["Concurrency Control", "Crude OS file locks", "Granular row/page 2PL and MVCC"],
          ["Crash Recovery", "Manual file scans (fsck)", "Automatic via Write-Ahead Log (WAL)"],
          ["Query Language", "Custom app code (grep, awk, C/Python)", "Declarative SQL with Cost-Based Optimizer"]
        ]
      },
      commonPitfalls: [
        "Assuming a DBMS is always faster: for simple single-file append-only logging, file systems can outperform due to zero query overhead.",
        "Confusing file permission security with database-level role-based column/row access control."
      ],
      mentalModelOrMnemonic: 'Mnemonic: "Files give raw storage; DBMS gives Structured Guarantees (ACID)."'
    },
    hardQuiz: [
      {
        id: "q1",
        question: "Two users attempt to book the last available flight seat simultaneously. Which DBMS mechanism guarantees only one booking succeeds without corrupting state?",
        options: ["ACID Concurrency Control & Isolation", "OS File Lock on the disk sector", "Buffer Pool replacement algorithm", "Data Encryption Standard"],
        correctIndex: 0,
        category: "application",
        explanation: "Isolation protocols (such as Two-Phase Locking or Snapshot Isolation) serialize concurrent updates to prevent lost updates or double bookings."
      },
      {
        id: "q2",
        question: "Which of the following is an example of Physical Data Independence in a DBMS?",
        options: [
          "Switching table storage from row-oriented heap to a clustered B+ tree without rewriting SQL queries",
          "Adding a new column to an existing table without notifying users",
          "Exporting database tables to CSV files",
          "Renaming user accounts in the authorization dictionary"
        ],
        correctIndex: 0,
        category: "conceptual",
        explanation: "Physical data independence means the internal storage structure or indexing can change without modifying logical schema queries."
      },
      {
        id: "q3",
        question: "What is the primary vulnerability of storing banking transaction logs directly in unmanaged flat OS files?",
        options: [
          "Partial writes during a power outage create corrupted, non-atomic half-states",
          "File systems cannot store numbers larger than 32 bits",
          "Flat files cannot be read across local networks",
          "OS kernels do not support text encoding"
        ],
        correctIndex: 0,
        category: "recall",
        explanation: "Without transactional write-ahead logging (WAL), crash during a write leaves inconsistent or unrecoverable bytes."
      },
      {
        id: "q4",
        question: "How does a DBMS buffer manager differ from the operating system page cache?",
        options: [
          "The DBMS buffer manager has domain knowledge of query plans, dirty pages, and WAL flush ordering (force/no-steal policies)",
          "The OS page cache can only read 1 byte at a time",
          "The DBMS buffer manager bypasses physical RAM entirely",
          "There is no difference; they are identical abstractions"
        ],
        correctIndex: 0,
        category: "differentiation",
        explanation: "A DBMS must strictly coordinate buffer pool flushes with the WAL protocol before writing dirty pages to disk, which general-purpose OS page caches do not understand."
      },
      {
        id: "q5",
        question: "Under what scenario is a standard OS file system objectively preferable to spinning up a full relational DBMS?",
        options: [
          "Streaming high-throughput unindexed sequential binary video assets or raw immutable sensor blobs",
          "Managing bank balances with concurrent transfers",
          "Running multi-table relational joins with foreign keys",
          "Managing inventory with frequent real-time updates"
        ],
        correctIndex: 0,
        category: "application",
        explanation: "Sequential binary media streams benefit from raw OS disk block streaming without DBMS transactional or relational engine overhead."
      }
    ],
    externalResources: [
      {
        type: "video",
        title: "Database Systems Architecture: File Systems vs DBMS",
        source: "CMU Database Group (YouTube)",
        description: "Lecture on disk storage, buffer pools, and relational invariants by Andy Pavlo.",
        url: "https://www.youtube.com/results?search_query=cmu+database+systems+file+system+vs+dbms",
        tag: "University Lecture"
      },
      {
        type: "article",
        title: "Architecture of a Database System",
        source: "Foundations and Trends in Databases (Hellerstein & Stonebraker)",
        description: "The landmark paper detailing why DBMS storage engines differ from OS files.",
        url: "https://en.wikipedia.org/wiki/Database",
        tag: "Seminal Literature"
      },
      {
        type: "reference",
        title: "Stanford CS145 Introduction to Databases",
        source: "Stanford University Online",
        description: "Formal course notes on data independence, schemas, and relational guarantees.",
        url: "https://web.stanford.edu/class/cs145/",
        tag: "Academic Syllabus"
      }
    ]
  },
  "three-schema architecture & data independence": {
    conceptual: {
      quick: "The ANSI/SPARC Three-Schema Architecture partitions a database into External (views), Conceptual (logical schema), and Internal (physical storage) layers to ensure data independence.",
      standard: "To prevent application code from breaking whenever storage formats or database layouts change, the Three-Schema Architecture separates the database into three levels: 1) External Level describes end-user views; 2) Conceptual Level defines all entities, relationships, constraints, and tables; 3) Internal Level governs physical file organization, indexes, compression, and page layouts.",
      deep: "Mappings between schemas bridge these layers. External/Conceptual mapping translates user view queries into operations on logical tables. Conceptual/Internal mapping translates logical table operations into disk block accesses and index traversals. If physical storage alters (e.g., adding an index or partitioning a table), only the Conceptual/Internal mapping changes, leaving user queries unaffected (Physical Data Independence).",
      expert: "Formal mappings: A user view V_i is defined as a view expression over conceptual relations R. When physical indexing \u03C0 changes, the optimizer adjusts physical execution operators without altering schema signature \u03A3. Logical data independence is more difficult to achieve because changing conceptual relations (e.g., splitting a table) often requires updating view definitions.",
      whatIsIt: "The canonical ANSI/SPARC 3-tier database framework establishing clear boundaries between user views, business logic, and disk storage.",
      whyExists: "To decouple client applications from underlying database schema reorganizations and physical storage upgrades.",
      problemSolved: "Eliminates costly application rewrites when database administrators optimize indexes, partition tables, or alter underlying hardware.",
      keyTakeaway: "External = Views, Conceptual = Tables & Rules, Internal = Blocks & Indexes."
    },
    interactive: {
      fillBlank: {
        question: "Identify the level of independence:",
        preText: "The capacity to alter the conceptual schema without having to rewrite external views or application programs is known as",
        missingWord: "Logical Data Independence",
        postText: ".",
        options: ["Logical Data Independence", "Physical Data Independence", "Hardware Virtualization", "Atomicity"],
        hint: "It deals with the conceptual/logical level of schemas.",
        explanation: "Logical Data Independence allows altering the conceptual schema (e.g. adding columns or tables) while maintaining existing user views."
      },
      matching: [
        { id: "m1", term: "External Level", definition: "Tailored views exposed to specific user groups or applications" },
        { id: "m2", term: "Conceptual Level", definition: "The unified logical structure of the entire database including all entities and constraints" },
        { id: "m3", term: "Internal Level", definition: "The physical implementation details such as B-Trees, page layouts, and record allocations" },
        { id: "m4", term: "Physical Independence", definition: "Altering internal storage without impacting conceptual schemas or external views" }
      ],
      ordering: {
        title: "ANSI/SPARC Query Resolution Hierarchy",
        instruction: "Trace a student query from the user down to physical storage blocks:",
        items: [
          { id: "o1", text: "User executes query against External View", correctOrder: 1 },
          { id: "o2", text: "DBMS translates query via External-Conceptual mapping into logical schema terms", correctOrder: 2 },
          { id: "o3", text: "DBMS evaluates Conceptual-Internal mapping to determine index traversals and page reads", correctOrder: 3 },
          { id: "o4", text: "Storage Engine retrieves physical disk blocks into Buffer Pool RAM", correctOrder: 4 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: [
        "Physical data independence is standard in virtually all modern relational databases (adding an index never breaks existing SELECT queries).",
        "Logical data independence is harder to achieve because significant conceptual restructuring (e.g., splitting a table into two) may require complex updatable views.",
        "Views in SQL (CREATE VIEW) are the concrete implementation of the External Level."
      ],
      comparisonTable: {
        title: "Three Schema Levels Matrix",
        headers: ["Level", "Audience", "What It Defines", "Example SQL Construct"],
        rows: [
          ["External", "End Users & Apps", "Individual customized views", "CREATE VIEW active_students AS..."],
          ["Conceptual", "DBA & Developers", "Complete logical model & constraints", "CREATE TABLE students (id INT PRIMARY KEY...)"],
          ["Internal", "Storage Engine", "Data layout, indexing, clustering", "CREATE INDEX idx_stu ON students USING btree..."]
        ]
      },
      commonPitfalls: [
        "Confusing Logical with Physical Independence: Physical refers to disk/index changes; Logical refers to schema/table structure changes.",
        "Assuming views store duplicated data: Standard views are virtual queries expanded at runtime, not independent tables."
      ],
      mentalModelOrMnemonic: 'Mnemonic: "E-C-I: Eyes see External, Core is Conceptual, Inside is Internal."'
    },
    hardQuiz: [
      {
        id: "q1",
        question: "A database administrator builds a composite B+ Tree index on (last_name, first_name) to accelerate search queries. No application code or queries are modified. What principle is demonstrated?",
        options: ["Physical Data Independence", "Logical Data Independence", "ACID Atomicity", "View Materialization"],
        correctIndex: 0,
        category: "conceptual",
        explanation: "Creating, dropping, or altering indexes modifies only the Internal storage level, exemplifying physical data independence."
      },
      {
        id: "q2",
        question: "A company splits a single Employee table into EmployeePersonal and EmployeeJobDetails tables, but creates an updatable view with the old schema name so existing apps run without changes. What does this demonstrate?",
        options: ["Logical Data Independence", "Physical Data Independence", "Deadlock Detection", "Physical De-clustering"],
        correctIndex: 0,
        category: "differentiation",
        explanation: "Changing the conceptual schema (splitting tables) while preserving the external interface via a view is the definition of Logical Data Independence."
      },
      {
        id: "q3",
        question: "Which of the three ANSI/SPARC schema levels is closest to physical computer hardware?",
        options: ["Internal Schema", "Conceptual Schema", "External Schema", "Network Schema"],
        correctIndex: 0,
        category: "recall",
        explanation: "The Internal Schema directly describes record layouts, page organizations, indexing methods, and compression on disk."
      },
      {
        id: "q4",
        question: "Why is Logical Data Independence generally more difficult to fully realize than Physical Data Independence?",
        options: [
          "Because modifying conceptual structures often invalidates write operations (INSERT/UPDATE/DELETE) through complex multi-table views",
          "Because disk drives cannot be upgraded without reformatting",
          "Because SQL does not support views",
          "Because foreign keys are prohibited in modern databases"
        ],
        correctIndex: 0,
        category: "application",
        explanation: "Updating decomposed conceptual tables through an external view often triggers ambiguity (non-updatable view problem in relational theory)."
      },
      {
        id: "q5",
        question: "Which component in the DBMS handles the transformation of a user query written on an external view into the physical storage operations?",
        options: [
          "The Query Parser, Rewriter, and Optimizer via Schema Mappings",
          "The Operating System Kernel Scheduler",
          "The Network Router",
          "The Hardware RAID controller"
        ],
        correctIndex: 0,
        category: "application",
        explanation: "The DBMS query processor rewrites view queries using catalog schema mappings, then selects the optimal physical access path."
      }
    ],
    externalResources: [
      {
        type: "video",
        title: "Three-Schema Architecture and Data Independence",
        source: "NPTEL Computer Science (YouTube)",
        description: "Comprehensive academic explanation of the ANSI/SPARC framework and mapping mechanisms.",
        url: "https://www.youtube.com/results?search_query=three+schema+architecture+dbms+lecture",
        tag: "Core Academic Theory"
      },
      {
        type: "article",
        title: "ANSI/SPARC Architecture Overview",
        source: "Wikipedia & Database Research",
        description: "Historical context and architectural implications of three-level data abstraction.",
        url: "https://en.wikipedia.org/wiki/ANSI-SPARC_Architecture",
        tag: "Reference Article"
      },
      {
        type: "reference",
        title: "Database System Concepts (Silberschatz, Korth, Sudarshan)",
        source: "McGraw-Hill Education",
        description: "Chapter 1: Data Abstraction and Schema Architectures.",
        url: "https://www.db-book.com/",
        tag: "Foundational Textbook"
      }
    ]
  }
};
function generateDynamicSubtopicContent(courseName, topicTitle, subtopicTitle, existingClarity = 50) {
  const normalizedKey = subtopicTitle.trim().toLowerCase();
  for (const [key, content] of Object.entries(curatedLibrary)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return {
        ...content,
        conceptual: {
          ...content.conceptual
        },
        interactive: {
          ...content.interactive
        },
        deepRevision: {
          ...content.deepRevision
        },
        hardQuiz: [...content.hardQuiz],
        externalResources: [...content.externalResources]
      };
    }
  }
  return {
    conceptual: {
      quick: `${subtopicTitle} is a foundational concept in ${topicTitle} (${courseName}) that formalizes how systems structure and process data reliably.`,
      standard: `In ${courseName}, ${subtopicTitle} establishes the governing rules and operational mechanics for ${topicTitle}. It ensures that data remains consistent, operations are efficient, and boundary constraints are strictly enforced across all execution stages.`,
      deep: `At an architectural level, ${subtopicTitle} balances computational complexity against storage overhead. By enforcing invariants and rigorous preconditions, it prevents edge-case anomalies, minimizes race conditions, and provides deterministic outcomes in concurrent and distributed environments.`,
      expert: `Formal specification: Given system state S and operation pipeline P under ${courseName}, ${subtopicTitle} models the transition relation \u03B4: S \xD7 I \u2192 S' such that all invariant assertions hold across arbitrary transaction interleavings and scale boundaries.`,
      whatIsIt: `The core principle governing structured behavior and invariants in ${subtopicTitle}.`,
      whyExists: `To eliminate inconsistencies, prevent cascading failures, and guarantee mathematical correctness in ${topicTitle}.`,
      problemSolved: `Solves ambiguity, data corruption, and inefficient access patterns in ${courseName}.`,
      keyTakeaway: `Master the invariants of ${subtopicTitle}: correctness precedes optimization.`
    },
    interactive: {
      fillBlank: {
        question: `Test your foundational grasp of ${subtopicTitle}:`,
        preText: `The primary guarantee enforced by ${subtopicTitle} in ${courseName} is`,
        missingWord: "consistent state preservation",
        postText: `across all operations.`,
        options: ["consistent state preservation", "unlimited memory allocation", "asynchronous network bypass", "hardware overclocking"],
        hint: `Think of maintaining system invariants and avoiding invalid states.`,
        explanation: `${subtopicTitle} is designed to ensure the system transitions exclusively between valid states without data corruption.`
      },
      matching: [
        { id: "m1", term: `${subtopicTitle} Invariant`, definition: "The non-negotiable rule that must remain true before and after every operation" },
        { id: "m2", term: "Precondition", definition: "The prerequisite state required before applying this technique" },
        { id: "m3", term: "Edge Case Scenario", definition: "A boundary condition where naive implementations typically fail" },
        { id: "m4", term: "Optimization Strategy", definition: "An architectural refinement that reduces time or space complexity" }
      ],
      ordering: {
        title: `${subtopicTitle} Workflow Execution`,
        instruction: "Arrange the sequential phases in standard execution order:",
        items: [
          { id: "o1", text: "Initialization and verification of baseline preconditions", correctOrder: 1 },
          { id: "o2", text: "Evaluating transformation rules and dependency mappings", correctOrder: 2 },
          { id: "o3", text: "Executing core operation while logging transition states", correctOrder: 3 },
          { id: "o4", text: "Commit phase and verification of postcondition invariants", correctOrder: 4 }
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
        headers: ["Dimension", `${subtopicTitle}`, "Naive Alternative", "Impact on System"],
        rows: [
          ["Invariants", "Formally verified", "Ad-hoc assumptions", "Zero corruption vs high anomaly rate"],
          ["Complexity", "Optimized O(log N) or O(N)", "Unbounded O(N\xB2)", "High scalability vs bottleneck"],
          ["Maintainability", "Modular and decoupled", "Tightly coupled monolithic", "Clean evolution vs fragility"]
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
        id: "q1",
        question: `What is the primary architectural purpose of ${subtopicTitle} within ${topicTitle}?`,
        options: [
          `To enforce rigorous correctness and structural invariants across operations`,
          `To bypass operating system security protocols`,
          `To eliminate the need for persistent disk storage`,
          `To compile source code into machine binary`
        ],
        correctIndex: 0,
        category: "conceptual",
        explanation: `${subtopicTitle} serves fundamentally to guarantee correctness, integrity, and predictable operational behavior.`
      },
      {
        id: "q2",
        question: `Under what circumstance would a system architect encounter a failure in ${subtopicTitle}?`,
        options: [
          `When preconditions are violated or concurrent updates violate isolation boundaries`,
          `When the system has excessive available RAM`,
          `When queries are written in uppercase characters`,
          `When network latency is 0 milliseconds`
        ],
        correctIndex: 0,
        category: "differentiation",
        explanation: "Failures in formal data mechanics arise when boundary invariants or concurrency preconditions are violated."
      },
      {
        id: "q3",
        question: `Which metric provides the most accurate indicator of mastery for ${subtopicTitle}?`,
        options: [
          `Ability to correctly identify edge-case boundary conditions and prevent anomalies`,
          `Speed of typing SQL or code keywords`,
          `Memorization of arbitrary version release numbers`,
          `Total lines of documentation generated`
        ],
        correctIndex: 0,
        category: "recall",
        explanation: "True conceptual clarity is demonstrated by recognizing subtle edge cases and explaining why boundary rules exist."
      },
      {
        id: "q4",
        question: `In a production environment encountering high throughput, how does ${subtopicTitle} scale?`,
        options: [
          `Through structured indexing, partitioning, and adherence to mathematical invariants`,
          `By disabling all data validation checks permanently`,
          `By deleting historic transactional logs indiscriminately`,
          `By replacing relational models with unstructured text dumps`
        ],
        correctIndex: 0,
        category: "application",
        explanation: "Scalability is achieved through principled indexing, partitioning, and disciplined invariant maintenance."
      },
      {
        id: "q5",
        question: `What distinguishes ${subtopicTitle} from more simplistic, unmanaged approaches in ${courseName}?`,
        options: [
          `Predictable deterministic guarantees and formal dependency preservation`,
          `Higher random failure rates`,
          `Total lack of schema definitions`,
          `Incompatibility with modern hardware`
        ],
        correctIndex: 0,
        category: "differentiation",
        explanation: "Systematic discipline, formal guarantees, and predictable outcomes are the defining attributes."
      }
    ],
    externalResources: [
      {
        type: "video",
        title: `Comprehensive Guide to ${subtopicTitle}`,
        source: `${courseName} Academy (YouTube)`,
        description: `Visual walkthrough and step-by-step breakdown of ${subtopicTitle}.`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subtopicTitle + " " + courseName)}`,
        tag: "Recommended Video"
      },
      {
        type: "article",
        title: `Technical Deep Dive: ${subtopicTitle}`,
        source: "ACM Computer Science Repository",
        description: `Authoritative theoretical breakdown of ${subtopicTitle} and system trade-offs.`,
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(subtopicTitle)}`,
        tag: "Core Reference"
      },
      {
        type: "reference",
        title: `${courseName} University Curriculum Standards`,
        source: "Computer Science Curricula 2026",
        description: `Formal specifications and syllabus guidelines for ${topicTitle}.`,
        url: "https://web.stanford.edu/class/cs145/",
        tag: "Academic Syllabus"
      }
    ]
  };
}

// src/lib/schemas.ts
import { z } from "zod";
var courseInputSchema = z.object({
  title: z.string().trim().min(2, { message: "Course name must be at least 2 characters" }).max(120, { message: "Course name cannot exceed 120 characters" }),
  subject: z.string().trim().min(2, { message: "Subject must be at least 2 characters" }).max(80, { message: "Subject cannot exceed 80 characters" }),
  academicLevel: z.string().trim().min(2).max(50),
  description: z.string().trim().max(1e3).optional().default(""),
  syllabus: z.string().trim().max(25e3).optional().default(""),
  durationDays: z.number().int().min(1).max(365).optional().default(30)
});
var subtopicContentRequestSchema = z.object({
  courseName: z.string().trim().min(1).max(120),
  topicTitle: z.string().trim().min(1).max(120),
  subtopicTitle: z.string().trim().min(1).max(120),
  existingClarity: z.number().min(0).max(100).optional().default(50),
  sourceReference: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  courseSyllabus: z.string().optional(),
  academicLevel: z.string().optional()
});
var diagnoseClarityRequestSchema = z.object({
  courseName: z.string().trim().optional(),
  topicTitle: z.string().trim().optional(),
  subtopicTitle: z.string().trim().min(1).max(150),
  concepts: z.array(z.string()).optional(),
  sourceReference: z.string().optional(),
  sourceExcerpt: z.string().optional(),
  questions: z.array(
    z.object({
      id: z.string().max(50),
      question: z.string().max(1e3),
      options: z.array(z.string().max(500)),
      correctIndex: z.number().int().min(0).max(10),
      category: z.enum(["conceptual", "recall", "application", "differentiation"]).optional(),
      explanation: z.string().optional()
    })
  ).min(1).max(10),
  userAnswers: z.record(z.string(), z.union([z.string(), z.number()]))
});
var extractedSubtopicSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(""),
  source_excerpt: z.string().optional().default(""),
  concepts: z.array(z.string()).optional().default([]),
  prerequisites: z.array(z.string()).optional().default([]),
  derived: z.boolean().optional().default(false),
  derived_from: z.array(z.string()).optional().default([])
});
var extractedTopicSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(""),
  source_excerpt: z.string().optional().default(""),
  subtopics: z.array(extractedSubtopicSchema).optional().default([])
});
var extractedUnitSchema = z.object({
  title: z.string().min(1),
  source_reference: z.string().optional().default(""),
  topics: z.array(extractedTopicSchema).min(1)
});
var sourceExtractionSchema = z.object({
  source_summary: z.string(),
  is_generic_starter: z.boolean().optional().default(false),
  units: z.array(extractedUnitSchema).min(1)
});
var generateRevisionRequestSchema = z.object({
  topicTitles: z.array(z.string().trim().max(120)).min(1).max(15),
  revisionType: z.string().trim().max(50).default("Mixed"),
  difficulty: z.string().trim().max(50).default("Medium"),
  questionCount: z.number().int().min(1).max(15).default(5)
});
var geminiSubtopicContentSchema = z.object({
  conceptual: z.object({
    quick: z.string(),
    standard: z.string(),
    deep: z.string(),
    expert: z.string(),
    whatIsIt: z.string(),
    whyExists: z.string(),
    problemSolved: z.string(),
    keyTakeaway: z.string()
  }),
  interactive: z.object({
    fillBlank: z.object({
      question: z.string(),
      preText: z.string(),
      missingWord: z.string(),
      postText: z.string(),
      options: z.array(z.string()),
      hint: z.string(),
      explanation: z.string()
    }),
    matching: z.array(
      z.object({
        id: z.string(),
        term: z.string(),
        definition: z.string()
      })
    ),
    ordering: z.object({
      title: z.string(),
      instruction: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          correctOrder: z.number()
        })
      )
    })
  }),
  deepRevision: z.object({
    detailedNotes: z.array(z.string()),
    comparisonTable: z.object({
      title: z.string(),
      headers: z.array(z.string()),
      rows: z.array(z.array(z.string()))
    }),
    commonPitfalls: z.array(z.string()),
    mentalModelOrMnemonic: z.string()
  }),
  hardQuiz: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      category: z.string().optional(),
      explanation: z.string()
    })
  ),
  externalResources: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      source: z.string(),
      description: z.string(),
      url: z.string(),
      tag: z.string().optional()
    })
  ).optional().default([])
});
var geminiDiagnoseClaritySchema = z.object({
  detectedIssue: z.string(),
  nextAction: z.string().optional(),
  remediationContent: z.object({
    comparisonExplanation: z.string(),
    followUpQuestion: z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string()
    })
  })
});
var topicAnalysisRequestSchema = z.object({
  topicTitle: z.string().trim().min(1, "Topic title cannot be empty").max(150),
  courseName: z.string().trim().optional().default("Course"),
  subject: z.string().trim().optional().default("General"),
  academicLevel: z.string().trim().optional().default("Undergraduate"),
  syllabusExcerpt: z.string().optional().default(""),
  sourceContext: z.string().optional().default("")
});
var topicSubtopicItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  order: z.number().int().min(1)
});
var keyConceptItemSchema = z.union([
  z.object({
    term: z.string().min(1),
    explanation: z.string().min(1)
  }),
  z.string().transform((str) => ({
    term: str,
    explanation: `Core mechanism and definition of ${str}.`
  }))
]);
var conceptualExampleItemSchema = z.union([
  z.object({
    title: z.string().min(1),
    explanation: z.string().min(1)
  }),
  z.string().transform((str) => ({
    title: "Practical Example",
    explanation: str
  }))
]);
var commonConfusionItemSchema = z.union([
  z.object({
    confusion: z.string().min(1),
    clarification: z.string().min(1)
  }),
  z.string().transform((str) => ({
    confusion: str,
    clarification: "Understand the underlying mechanism and boundary invariants to avoid this misconception."
  }))
]);
var conceptualClaritySchema = z.object({
  summary: z.string().min(1),
  explanation: z.string().min(1),
  key_concepts: z.array(keyConceptItemSchema).default([]),
  examples: z.array(conceptualExampleItemSchema).default([]),
  analogy: z.string().nullable().default(null),
  common_confusions: z.array(commonConfusionItemSchema).default([]),
  key_takeaways: z.array(z.string()).default([])
});
var topicAnalysisResultSchema = z.object({
  topic: z.string().min(1),
  has_subtopics: z.boolean(),
  reason_for_structure: z.string().min(1),
  subtopics: z.array(topicSubtopicItemSchema).default([]),
  conceptual_clarity: conceptualClaritySchema
}).refine((data) => {
  if (!data.has_subtopics) {
    return !data.subtopics || data.subtopics.length === 0;
  }
  return true;
}, {
  message: "When has_subtopics is false, subtopics must be empty.",
  path: ["subtopics"]
});
var conceptualClarityRequestSchema = z.object({
  courseName: z.string().trim().default("Course"),
  topicTitle: z.string().trim().min(1),
  subtopicTitle: z.string().trim().optional(),
  unitTitle: z.string().optional(),
  concepts: z.array(z.string()).optional(),
  sourceExcerpt: z.string().optional(),
  syllabusExcerpt: z.string().optional(),
  academicLevel: z.string().default("Undergraduate"),
  existingClarity: z.number().optional().default(50)
});
var generateQuestionRequestSchema = z.object({
  courseName: z.string().default("Course"),
  topicTitle: z.string().min(1),
  subtopicTitle: z.string().optional(),
  clarity: conceptualClaritySchema.optional(),
  academicLevel: z.string().default("Undergraduate")
});
var interactiveQuestionSchema = z.object({
  id: z.string().default(() => "q_" + Math.random().toString(36).substring(2, 9)),
  question: z.string().min(1),
  questionType: z.enum([
    "conceptual",
    "recall",
    "differentiation",
    "application",
    "reasoning",
    "scenario",
    "sequencing",
    "prediction",
    "error_identification"
  ]).default("conceptual"),
  scenario: z.string().optional(),
  options: z.array(z.string()).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
  whyWrongMap: z.record(z.string(), z.string()).optional(),
  targetConcept: z.string().optional()
});
var answerEvaluationRequestSchema = z.object({
  courseName: z.string().optional(),
  topicTitle: z.string().optional().default("Topic"),
  subtopicTitle: z.string().optional(),
  question: z.union([
    interactiveQuestionSchema,
    z.object({
      id: z.string().optional(),
      question: z.string(),
      questionType: z.string().optional(),
      options: z.array(z.string()),
      correctIndex: z.number().int(),
      explanation: z.string().optional().default(""),
      whyWrongMap: z.record(z.string(), z.string()).optional(),
      targetConcept: z.string().optional()
    })
  ]),
  selectedIndex: z.number().int().optional(),
  userSelectedIndex: z.number().int().optional(),
  confidence: z.enum(["low", "medium", "high"]).default("medium")
}).transform((data) => ({
  courseName: data.courseName,
  topicTitle: data.topicTitle || "Topic",
  subtopicTitle: data.subtopicTitle,
  question: {
    id: data.question.id || "q_1",
    question: data.question.question,
    questionType: data.question.questionType || "conceptual",
    options: data.question.options,
    correctIndex: data.question.correctIndex,
    explanation: data.question.explanation || "",
    whyWrongMap: data.question.whyWrongMap,
    targetConcept: data.question.targetConcept
  },
  selectedIndex: data.selectedIndex ?? data.userSelectedIndex ?? 0,
  confidence: data.confidence
}));
var answerEvaluationResultSchema = z.object({
  isCorrect: z.boolean(),
  didacticFeedback: z.string(),
  coreConceptReinforced: z.string(),
  clarityShift: z.number(),
  adaptiveRecommendation: z.object({
    action: z.enum(["advance", "reinforce", "investigate_misconception", "simplify_and_reteach", "prerequisite_gap"]),
    reason: z.string(),
    nextStepLabel: z.string()
  })
});

// src/server/learningEngine.ts
function safeExtractJson(raw) {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
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
var domainExpertExplanations = {
  "process scheduling": {
    summary: "Process Scheduling is the operating system mechanism that decides which ready process is allocated CPU execution time, balancing throughput, latency, and fairness.",
    explanation: `When multiple programs run concurrently on a computer, the number of active processes almost always exceeds the number of physical CPU cores. Without coordination, processes would either monopolize the processor or starve waiting for execution. Process scheduling resolves this fundamental contention by switching the CPU among processes in rapid succession, creating the illusion of simultaneous execution while maximizing hardware utilization.

The operating system scheduler operates on distinct queues: the Job Queue (all processes entering the system), the Ready Queue (processes residing in memory waiting for CPU allocation), and Device Waiting Queues. The dispatcher performs the actual context switch, saving the registers and Program Counter of the departing process into its Process Control Block (PCB) and loading the state of the chosen process.

Scheduling decisions typically occur under four state transitions: when a process moves from Running to Waiting (e.g., I/O request), from Running to Ready (e.g., timer interrupt), from Waiting to Ready (e.g., I/O completion), or when a process terminates. Schedulers that interrupt running processes on timer events are preemptive, whereas non-preemptive schedulers allow a process to run until it voluntarily yields control or blocks on I/O.

Different algorithms optimize for conflicting criteria. First-Come First-Served (FCFS) is simple but suffers from the Convoy Effect, where short jobs wait behind long CPU-bound tasks. Shortest Job First (SJF) achieves mathematically optimal average turnaround time but requires predicting future burst lengths. Round Robin (RR) introduces a fixed time quantum to guarantee bounded response times for interactive applications.`,
    key_concepts: [
      { term: "Ready Queue", explanation: "A queue of processes loaded in main memory that are ready and waiting to execute on a CPU core." },
      { term: "Context Switch", explanation: "The kernel routine that saves the execution context (registers, PC) of the running process and loads the context of the next scheduled process." },
      { term: "Preemption", explanation: "The ability of the operating system kernel to forcibly interrupt a running process before its CPU burst completes to run another process." },
      { term: "Time Quantum", explanation: "The maximum continuous time slice allocated to a process in preemptive algorithms like Round Robin before a context switch occurs." }
    ],
    examples: [
      {
        title: "Round Robin Execution Trace",
        explanation: "Consider three processes P1 (burst 24ms), P2 (burst 3ms), and P3 (burst 3ms) arriving at time 0 with a time quantum of 4ms. P1 runs for 4ms (20ms remaining), then is preempted. P2 runs for 3ms and terminates at t=7ms. P3 runs for 3ms and terminates at t=10ms. P1 resumes at t=10ms and runs to completion at t=30ms. Notice that P2 and P3 finish in 7ms and 10ms respectively, whereas in non-preemptive FCFS they would have waited 24ms and 27ms."
      }
    ],
    analogy: "Think of CPU scheduling like a doctor triage room in an emergency clinic: instead of examining one patient with a 4-hour surgery while everyone with simple bandages waits outside, the doctor gives quick checkups to urgent cases or rotates through consultation slots so every patient progresses.",
    common_confusions: [
      {
        confusion: "Confusing Long-Term, Medium-Term, and Short-Term Schedulers",
        clarification: "The Short-Term Scheduler (CPU Scheduler) selects which in-memory process gets the CPU in milliseconds. The Long-Term Scheduler (Job Scheduler) controls the degree of multiprogramming by admitting processes from disk to memory. The Medium-Term Scheduler handles memory swapping."
      },
      {
        confusion: "Assuming Round Robin is always fairer and faster than Shortest Job First",
        clarification: "Round Robin provides superior interactive responsiveness, but its average turnaround time is often worse than SJF due to context-switching overhead when the time quantum is improperly tuned."
      }
    ],
    key_takeaways: [
      "Scheduling manages CPU allocation among competing processes in the Ready Queue.",
      "Preemptive algorithms allow timer interrupts to prevent CPU monopolization.",
      "Context switching incurs pure overhead; time quanta must be large relative to switch time.",
      "No single algorithm is best: choice depends on optimizing throughput, turnaround time, or responsiveness."
    ]
  },
  "cpu registers": {
    summary: "CPU Registers are small, ultra-fast storage locations located directly inside the processor core that hold operands, immediate memory addresses, and architectural execution flags.",
    explanation: `At the apex of the computer memory hierarchy lie CPU registers. While main memory (RAM) and solid-state drives store gigabytes to terabytes of data, accessing RAM requires traversing the system bus and memory controller, consuming tens to hundreds of processor clock cycles. CPU registers exist directly on the processor die alongside the Arithmetic Logic Unit (ALU), allowing read and write operations to complete in a single fraction of a clock cycle.

In modern computer architectures, registers are divided into general-purpose and special-purpose categories. General-Purpose Registers (such as RAX, RBX, RCX, RDX in x86-64, or X0-X30 in ARM64) hold arithmetic operands, loop counters, and temporary results during computation. Rather than fetching operands from main memory for every addition or comparison, compilers aggressively optimize register allocation so intermediate values remain inside registers for the duration of a loop or function.

Special-Purpose Registers are architectural registers that govern the fetch-decode-execute instruction cycle. The Program Counter (PC or RIP) holds the memory address of the next machine instruction to be fetched. The Instruction Register (IR) holds the binary opcode currently being decoded by the control unit. The Stack Pointer (SP or RSP) tracks the top of the runtime call stack, and the Status/Flags Register (EFLAGS) records condition codes such as Zero, Sign, Overflow, and Carry after arithmetic operations.

Because register space is physically constrained by silicon area and instruction encoding bit-widths (typically 16 to 64 registers total), register allocation is a core challenge in compiler design. When a function requires more active variables than available registers, the compiler performs "register spilling," storing excess values onto the stack in main memory and reloading them as needed.`,
    key_concepts: [
      { term: "Program Counter (PC)", explanation: "A special-purpose CPU register that continuously stores the memory address of the next instruction to be fetched and executed." },
      { term: "General-Purpose Registers (GPR)", explanation: "High-speed processor registers used by machine instructions to hold active data operands, pointers, and arithmetic results." },
      { term: "Register Spilling", explanation: "The compiler technique of transferring register contents to memory (the stack) when the number of live variables exceeds available hardware registers." },
      { term: "Instruction Register (IR)", explanation: "The internal processor register that stores the binary instruction fetched from memory while the control unit decodes it." }
    ],
    examples: [
      {
        title: "Assembly Arithmetic on Registers vs Memory",
        explanation: "In x86-64 assembly, adding two numbers stored in memory requires: `MOV EAX, [mem_a]` (load into register EAX, ~10ns if cache miss), followed by `ADD EAX, [mem_b]` (compute in ALU), and `MOV [mem_c], EAX` (store back). If the values are already in registers, `ADD EAX, EBX` executes in less than 0.3 nanoseconds (1 cycle), illustrating the order-of-magnitude speed difference."
      }
    ],
    analogy: "Think of CPU registers as the items held in your hands right now while cooking, compared to ingredients in the refrigerator (cache) or grocery store across town (RAM). You can instantly cut whatever is in your hands, but retrieving anything else requires walking away from the cutting board.",
    common_confusions: [
      {
        confusion: "Confusing CPU Registers with CPU Cache (L1/L2/L3)",
        clarification: "Registers are explicitly addressed by machine instructions (e.g. `%eax`), whereas cache memory is transparent hardware SRAM managed automatically by the CPU memory controller."
      },
      {
        confusion: "Believing larger register counts always improve performance",
        clarification: "More registers increase instruction encoding size (more bits needed to address each register) and lengthen context switch times because every register must be saved to the PCB."
      }
    ],
    key_takeaways: [
      "Registers are the fastest and smallest memory tier, operating in sub-nanosecond clock cycles.",
      "General-purpose registers hold active operands; special registers (PC, SP, Flags) manage processor state.",
      "Compilers perform graph coloring to maximize register utilization and avoid memory spilling.",
      "Registers are referenced directly by assembly opcodes, unlike transparent hardware caches."
    ]
  },
  "virtual memory": {
    summary: "Virtual Memory is a memory virtualization technique that maps a process's uniform logical address space to fragmented physical RAM and secondary storage via hardware page tables.",
    explanation: `Early computers loaded program binaries directly into continuous physical addresses. This meant a program could overwrite memory belonging to the kernel or other programs, and no program could be larger than the physical RAM installed in the machine. Virtual memory overcomes these limitations by decoupling the programmer's view of memory from physical reality: every process believes it owns a contiguous, private address space starting at address 0.

The fundamental mechanism enabling virtual memory is Paging. The process's logical address space is divided into fixed-size chunks called "pages" (typically 4 KB in modern OSs). Physical RAM is similarly divided into equal-sized chunks called "frames." The operating system constructs a Page Table for each process, storing the mapping between virtual page numbers and physical frame numbers. The Memory Management Unit (MMU) in CPU hardware intercepts every memory access, translating the virtual address into a physical address on the fly.

To make translation fast, processors include the Translation Lookaside Buffer (TLB), a hardware cache of recent virtual-to-physical page mappings. When a memory access hits the TLB, translation occurs in a single clock cycle. If a TLB miss occurs, the MMU performs a multi-level page table walk in main memory to resolve the frame address.

Virtual memory also enables Demand Paging: pages are not loaded into physical RAM until the process actually accesses them. If a program references a page that resides on disk rather than in physical RAM, the MMU raises a hardware interrupt known as a Page Fault. The OS kernel traps the fault, reads the missing page from swap space into an available frame, updates the page table with the valid bit, and restarts the faulting instruction seamlessly.`,
    key_concepts: [
      { term: "Page Table", explanation: "A per-process operating system data structure that maps virtual page numbers (VPN) to physical frame numbers (PFN) along with permission bits." },
      { term: "Memory Management Unit (MMU)", explanation: "A hardware component inside the CPU that translates logical/virtual addresses into physical memory addresses during instruction execution." },
      { term: "Translation Lookaside Buffer (TLB)", explanation: "A high-speed associative hardware cache inside the MMU storing the most recently translated virtual-to-physical address mappings." },
      { term: "Page Fault", explanation: "A hardware trap triggered by the MMU when a process references a virtual page that is currently marked invalid or not resident in physical RAM." }
    ],
    examples: [
      {
        title: "Page Fault Handling Lifecycle",
        explanation: "1. Process executes `MOV EAX, [0x00405000]`. 2. MMU looks up page 0x405 in the page table; finds valid bit = 0 (page not in RAM). 3. MMU raises a Page Fault interrupt, switching CPU to kernel mode. 4. Kernel looks up backing swap file, allocates physical frame 12, and issues disk read I/O. 5. While disk transfers data, the process is put into Waiting state and another process runs. 6. When disk I/O completes, kernel sets page 0x405 -> frame 12, marks valid bit = 1, and re-executes the exact `MOV` instruction."
      }
    ],
    analogy: "Virtual memory is like an index in a large library catalog: every book has a call number (virtual address), and the catalog card tells you the exact shelf and room number (physical frame). If a popular book is currently in the off-site warehouse (swap disk), the librarian fetches it to the reading room desk before handing it to you.",
    common_confusions: [
      {
        confusion: "Confusing Virtual Memory with Swap Space",
        clarification: "Virtual memory is the complete architectural system of page tables, MMU translation, and protection. Swap space is simply the secondary disk storage used to hold pages when RAM is full."
      },
      {
        confusion: "Believing a Page Fault means an unrecoverable program crash",
        clarification: "A page fault is a routine hardware mechanism used for demand paging. Only when a process accesses an illegal address outside its allocated segments does a segmentation fault (SIGSEGV) crash occur."
      }
    ],
    key_takeaways: [
      "Virtual memory provides process isolation, memory protection, and the ability to run programs larger than physical RAM.",
      "Address translation is performed by the MMU using Page Tables and accelerated by the TLB cache.",
      "Demand paging loads pages into memory only when accessed, handling missing pages via Page Fault traps.",
      "Thrashing occurs when excessive page faulting leads to constant disk swapping, halting useful CPU work."
    ]
  },
  "derivatives": {
    summary: "A Derivative measures the instantaneous rate of change of a mathematical function with respect to an independent variable, geometrically representing the tangent slope to a curve.",
    explanation: `In algebra, we calculate the average rate of change between two distinct points on a line using the familiar slope formula: change in y divided by change in x (\u0394y / \u0394x). However, in the natural and computational worlds\u2014such as calculating the instantaneous speed of an accelerating vehicle or optimizing loss functions in machine learning\u2014quantities change continuously along curves rather than straight lines.

The derivative solves the problem of finding the rate of change at a single exact instant. Geometrically, this corresponds to finding the slope of the tangent line that touches a curve at exactly one point. Because you cannot simply divide 0 by 0, calculus defines the derivative as the limit of the difference quotient as the distance between two points (h) approaches zero: f'(x) = lim (h -> 0) [f(x + h) - f(x)] / h.

Through this limit definition, mathematicians established foundational differentiation rules that allow calculating derivatives without computing limits from scratch every time. The Power Rule states that d/dx [x^n] = n * x^(n-1). The Product Rule dictates how to differentiate the product of two functions, while the Chain Rule enables differentiating composite functions f(g(x)) by multiplying the outer derivative by the inner derivative.

In modern computer science and engineering, derivatives form the mathematical engine of Optimization. Gradient Descent algorithms compute partial derivatives of loss functions with respect to millions of neural network weights, adjusting parameters in the direction of steepest descent to train artificial intelligence models.`,
    key_concepts: [
      { term: "Instantaneous Rate of Change", explanation: "The rate at which a dependent variable changes at a single specific instant, defined via the limit as time or distance interval approaches zero." },
      { term: "Tangent Line", explanation: "A straight line that touches a smooth curve at a single point, having a slope equal to the derivative of the function at that point." },
      { term: "Chain Rule", explanation: "A formula for computing the derivative of the composition of two or more functions: (f \u2218 g)'(x) = f'(g(x)) \xB7 g'(x)." },
      { term: "Gradient", explanation: "A vector of partial derivatives representing the direction and rate of fastest increase of a multi-variable function." }
    ],
    examples: [
      {
        title: "Power Rule Derivation with Physical Intuition",
        explanation: "Consider a falling object whose position is given by s(t) = 5t^2 (in meters). To find the exact instantaneous velocity at t = 3 seconds: Apply the Power Rule d/dt [5t^2] = 5 * 2t = 10t. At t = 3 seconds, velocity v(3) = 10 * 3 = 30 m/s. The derivative transformed a position equation into an exact velocity measurement."
      }
    ],
    analogy: "Imagine driving down a winding highway. Your trip speedometer average over 2 hours is 60 mph (average rate of change), but when you glance down at your digital speedometer at an exact split second as you pass a speed camera, it reads 72 mph\u2014that instantaneous reading is the derivative.",
    common_confusions: [
      {
        confusion: "Confusing Average Rate of Change with Instantaneous Rate of Change",
        clarification: "Average rate measures total change over a non-zero interval \u0394x, whereas instantaneous rate (the derivative) represents the exact slope at a single infinitesimal instant."
      },
      {
        confusion: "Confusing the value of a function f(a) with the derivative f'(a)",
        clarification: "f(a) tells you the height/position on the curve, whereas f'(a) tells you the direction and steepness of the curve at that point."
      },
      {
        confusion: "Assuming zero derivative means the function stopped existing",
        clarification: "When f'(x) = 0, the curve is momentarily flat/horizontal, indicating a local maximum, local minimum, or stationary inflection point."
      }
    ],
    key_takeaways: [
      "The derivative is the limit of the difference quotient as the interval approaches zero.",
      "Geometrically, it represents the slope of the tangent line at any point on a curve.",
      "Fundamental rules (Power, Product, Quotient, Chain) simplify computing complex derivatives.",
      "Derivatives are foundational to physics, optimization, control systems, and neural network training."
    ]
  },
  "normalization": {
    summary: "Database Normalization is the systematic process of organizing relational database tables to eliminate data redundancy, prevent modification anomalies, and enforce data integrity.",
    explanation: `When designing a relational database, storing all attributes in a single large, unnormalized table seems intuitive at first glance. However, mixing multiple real-world entities into one table introduces severe maintenance problems known as modification anomalies. Insertion anomalies occur when you cannot record one fact without inventing false data for an unrelated entity. Deletion anomalies cause accidental loss of unrelated information when deleting a record. Update anomalies require modifying duplicate values in hundreds of rows, risking inconsistent data if any row is missed.

Database Normalization resolves these anomalies by decomposing tables into smaller, well-structured relations based on Functional Dependencies. A functional dependency X -> Y means that attribute X uniquely determines attribute Y (for example, StudentID uniquely determines StudentName).

The normalization process proceeds through progressive stages known as Normal Forms:
1. First Normal Form (1NF): Requires atomic values (no repeating groups, comma-separated lists, or arrays in a column) and a unique primary key for each record.
2. Second Normal Form (2NF): Satisfies 1NF and eliminates Partial Dependencies, meaning every non-key attribute must depend on the whole primary key, not a subset of a composite key.
3. Third Normal Form (3NF): Satisfies 2NF and eliminates Transitive Dependencies, meaning non-key attributes must depend directly on the primary key, rather than through another non-key attribute (no "X -> Y and Y -> Z").
4. Boyce-Codd Normal Form (BCNF): A stricter version of 3NF where every determinant must be a candidate key.

While higher normal forms guarantee zero data redundancy and maximum write integrity, they require joining multiple tables during queries, which can introduce read latency. In real-world system architecture, engineers normalize databases to 3NF/BCNF for transactional processing (OLTP) and selectively denormalize for read-heavy analytics (OLAP).`,
    key_concepts: [
      { term: "Functional Dependency", explanation: "A relationship between attributes where the value of one attribute (the determinant) uniquely identifies the value of another." },
      { term: "Insertion Anomaly", explanation: "The inability to insert data about one entity without unnaturally creating dummy data for another unrelated entity." },
      { term: "Partial Dependency", explanation: "A condition in composite-key tables where a non-key attribute depends on only part of the primary key rather than the entire key." },
      { term: "Transitive Dependency", explanation: "An indirect relationship where non-key attribute A determines non-key attribute B, which in turn determines non-key attribute C." }
    ],
    examples: [
      {
        title: "3NF Decomposition Trace",
        explanation: "Given unnormalized table: `StudentCourse(StudentID, CourseID, StudentName, CourseInstructor, InstructorOffice)`. \n1. Composite PK is (StudentID, CourseID). \n2. `StudentName` depends only on `StudentID` (Partial dependency -> breaks 2NF). Separate into `Students(StudentID, StudentName)` and `Enrollments(StudentID, CourseID, CourseInstructor, InstructorOffice)`. \n3. In Enrollments, `CourseInstructor` determines `InstructorOffice` (Transitive dependency -> breaks 3NF). Separate into `Courses(CourseID, CourseInstructor)` and `Instructors(CourseInstructor, InstructorOffice)`. Result: Zero duplicate office numbers if an instructor teaches 5 courses."
      }
    ],
    analogy: "Imagine filing customer orders on paper receipts by writing out the customer's full name, phone number, address, and credit card number on every single receipt. If the customer moves, you must find and rewrite thousands of old receipts. Normalization gives the customer a Customer ID and stores their address on a single master card.",
    common_confusions: [
      {
        confusion: "Assuming 3NF and BCNF are identical",
        clarification: "3NF permits non-prime attributes to be determined by a candidate key, but allows X -> Y if Y is part of a candidate key even if X is not. BCNF strictly requires every determinant X to be a superkey."
      },
      {
        confusion: "Believing higher normal forms are always superior in every production system",
        clarification: "Normalization prevents anomalies in transactional writes, but in read-heavy reporting systems (data warehouses), excessive joins hurt query speed; selective denormalization is intentionally practiced."
      }
    ],
    key_takeaways: [
      "Normalization decomposes tables to eliminate insertion, deletion, and update anomalies.",
      "1NF enforces atomic values; 2NF eliminates partial dependencies; 3NF eliminates transitive dependencies.",
      "Functional dependencies are the mathematical basis for determining proper table boundaries.",
      "OLTP systems prioritize 3NF/BCNF; analytics systems often denormalize into star/snowflake schemas."
    ]
  },
  "object-oriented programming": {
    summary: "Object-Oriented Programming (OOP) is a programming paradigm based on modeling software as interacting objects that encapsulate private state and exposed behavior.",
    explanation: `In procedural programming, programs are organized around linear procedures and functions operating on detached, global data structures. As applications grow to hundreds of thousands of lines of code, any function can inadvertently mutate shared data, making debugging, refactoring, and code reuse difficult. Object-Oriented Programming addresses this structural scaling problem by bundling state (data fields/properties) and behavior (functions/methods) into cohesive, self-governing units called Objects.

The architectural foundation of OOP rests upon four core pillars:
1. Encapsulation: Hiding the internal state and implementation details of an object behind a well-defined public interface. By restricting direct access via access modifiers (private, protected), objects maintain their own invariants and prevent external code from corrupting state.
2. Abstraction: Presenting simple, high-level interfaces that conceal complex internal mechanics. A caller needs to know what a method does (e.g., \`database.connect()\`), not how network sockets or SSL handshakes are handled internally.
3. Inheritance: Establishing hierarchical relationships where specialized classes inherit common state and methods from generalized parent classes, promoting clean code reuse.
4. Polymorphism: The ability for different underlying types to respond to the same interface or method signature in their own specialized manner, typically achieved via method overriding and dynamic dispatch at runtime.

Modern software engineering applies OOP alongside SOLID principles to build loosely-coupled, maintainable systems. Rather than relying on rigid, deep inheritance trees, contemporary best practices emphasize composition over inheritance and interface segregation to maximize testability and flexibility.`,
    key_concepts: [
      { term: "Encapsulation", explanation: "Bundling data and the methods that operate on that data within a single class while restricting direct external access to internal state." },
      { term: "Dynamic Dispatch", explanation: "The runtime mechanism by which a polymorphic method call is resolved to the concrete implementation of the actual object instance." },
      { term: "Interface", explanation: "A contract that specifies which methods a class must implement without defining the concrete method bodies." },
      { term: "Composition over Inheritance", explanation: "The design principle recommending that classes achieve polymorphic reuse by containing instances of other classes rather than subclassing." }
    ],
    examples: [
      {
        title: "Polymorphism in Payment Processing Architecture",
        explanation: "Consider an eCommerce system. An interface `PaymentProcessor` defines `processPayment(amount: number): boolean`. Concrete classes `StripeProcessor`, `PayPalProcessor`, and `CryptoProcessor` implement this method differently. The checkout service calls `processor.processPayment(100)` without knowing which payment gateway is active. Adding Apple Pay requires creating a new class without modifying a single line of existing checkout logic."
      }
    ],
    analogy: "Think of driving a modern automobile: you interact with an abstract interface (steering wheel, accelerator pedal, brake). You do not need to know whether the engine under the hood is a V6 internal combustion engine, an electric induction motor, or a hybrid; stepping on the pedal accelerates the vehicle polymorphically.",
    common_confusions: [
      {
        confusion: "Confusing Encapsulation with simple data hiding",
        clarification: "Encapsulation is the active bundling of state and behavior together; data hiding (making fields private) is just the visibility mechanism used to enforce that encapsulation."
      },
      {
        confusion: "Believing inheritance should always be used to share code",
        clarification: "Inheritance creates tight architectural coupling ('is-a' relationship). When you only want to reuse functionality, composition ('has-a' relationship) is far safer and more maintainable."
      }
    ],
    key_takeaways: [
      "OOP organizes software around encapsulated objects combining state and behavior.",
      "Four pillars: Encapsulation (data safety), Abstraction (complexity hiding), Inheritance (reuse), Polymorphism (interchangeability).",
      "Dynamic dispatch enables runtime polymorphism, allowing systems to be extended without breaking existing code.",
      "Prefer composition over deep inheritance trees for flexible, maintainable architecture."
    ]
  }
};
async function generateConceptualClarity(ai, caller, params) {
  const cleanTopic = params.topicTitle.trim();
  const cleanSubtopic = params.subtopicTitle?.trim() || cleanTopic;
  const course = params.courseName?.trim() || "Course";
  const unit = params.unitTitle?.trim() || cleanTopic;
  const level = params.academicLevel?.trim() || "Undergraduate";
  const excerpt = (params.sourceExcerpt || params.syllabusExcerpt || "").trim();
  const lookupKey = cleanSubtopic.toLowerCase().trim();
  for (const [key, expertData] of Object.entries(domainExpertExplanations)) {
    if (lookupKey.includes(key) || key.includes(lookupKey)) {
      return {
        summary: expertData.summary || "",
        explanation: expertData.explanation || "",
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
${excerpt || "No specific textbook excerpt. Ground strictly in standard academic principles for " + course + "."}
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
      const raw = await caller(ai, prompt, { responseMimeType: "application/json" });
      const parsed = safeExtractJson(raw);
      if (parsed) {
        const val = conceptualClaritySchema.safeParse(parsed);
        if (val.success) {
          return val.data;
        }
      }
    } catch (err) {
      console.warn("[learningEngine] Gemini conceptual clarity generation error, falling back to deterministic synthesis:", err);
    }
  }
  return synthesizeRichFallbackClarity(cleanTopic, cleanSubtopic, course, level, excerpt);
}
function synthesizeRichFallbackClarity(topic, subtopic, course, level, excerpt) {
  const summary = `${subtopic} is an essential concept within ${topic} (${course}), formalizing the principles, boundaries, and operational mechanisms required for predictable system performance.`;
  const p1 = `In ${course}, ${subtopic} addresses a core engineering and theoretical challenge: how to coordinate resources and manage state transitions without introducing unconstrained latency or ambiguity. Rather than treating ${subtopic} as an isolated fact, it must be understood as an intentional architectural design developed to replace ad-hoc, error-prone approaches with deterministic guarantees.`;
  const p2 = `The motivation behind ${subtopic} arises directly from real-world constraints in ${topic}. In any non-trivial computational or physical system, uncoordinated interactions lead to contention, resource starvation, or corrupted state invariants. By establishing clear structural protocols, ${subtopic} ensures that each stage of execution is validated before downstream operations depend on it.`;
  const p3 = `In operation, ${subtopic} functions through a multi-stage mechanism. First, preconditions and input state boundaries are verified to prevent invalid transitions. Next, the primary transformation policy is applied, systematically allocating capacity or executing logic according to predefined constraints. Finally, state metadata is preserved and verified against system invariants before control is transferred back to callers.`;
  const p4 = `In practical environments, mastering ${subtopic} is critical for diagnosing performance bottlenecks and preventing architectural regression. Engineers and practitioners evaluate trade-offs in ${subtopic}\u2014such as computational overhead versus safety, or memory footprint versus throughput\u2014to optimize systems under variable production workloads.`;
  const explanation = `${p1}

${p2}

${p3}

${p4}`;
  return {
    summary,
    explanation,
    key_concepts: [
      {
        term: "Operational Invariant",
        explanation: `The fundamental condition that ${subtopic} must guarantee to remain true throughout all state transitions.`
      },
      {
        term: "Boundary Condition",
        explanation: `The critical threshold where ${subtopic} behavior transitions from standard execution to edge-case handling.`
      },
      {
        term: "State Metadata",
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
async function generateInteractiveQuestion(ai, caller, params) {
  const { topicTitle, subtopicTitle, clarity, courseName = "Course" } = params;
  const target = subtopicTitle || topicTitle;
  if (ai && caller) {
    const prompt = `You are Knowiq's Interactive Pedagogical Question Designer.
Your task is to create a SINGLE HIGH-YIELD DIDACTIC QUESTION that tests genuine conceptual understanding\u2014NOT trivia.

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
      const raw = await caller(ai, prompt, { responseMimeType: "application/json" });
      const parsed = safeExtractJson(raw);
      if (parsed) {
        const val = interactiveQuestionSchema.safeParse(parsed);
        if (val.success) {
          return val.data;
        }
      }
    } catch (err) {
      console.warn("[learningEngine] Question generation error, using deterministic synthesis:", err);
    }
  }
  const firstConfusion = clarity.common_confusions[0];
  const confusionText = typeof firstConfusion === "object" ? firstConfusion.confusion : String(firstConfusion || "Overlooking boundary constraints");
  const clarificationText = typeof firstConfusion === "object" ? firstConfusion.clarification : "Understanding boundary constraints is critical for system correctness.";
  return {
    id: `q_${Date.now()}`,
    question: `In the context of ${target}, which design decision best reflects its core operational principle?`,
    questionType: "conceptual",
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
      "1": "Bypassing boundary checks sacrifices state integrity for temporary throughput, leading to system corruption.",
      "2": `This represents a common misconception: ${clarificationText}`,
      "3": "Eliminating state tracking prevents the system from coordinating concurrent access or validating preconditions."
    },
    targetConcept: target
  };
}
function evaluateAnswer(params) {
  const { question, selectedIndex, confidence } = params;
  const isCorrect = selectedIndex === question.correctIndex;
  let didacticFeedback = "";
  let coreConceptReinforced = question.targetConcept || "Core Principle";
  let clarityShift = 0;
  let adaptiveAction = "advance";
  let reason = "";
  let nextStepLabel = "";
  if (isCorrect) {
    clarityShift = confidence === "high" ? 15 : 10;
    coreConceptReinforced = question.options[question.correctIndex];
    didacticFeedback = `Exactly right! ${question.explanation}`;
    if (confidence === "high") {
      adaptiveAction = "advance";
      reason = "You answered correctly with high confidence. You have mastered this concept and are ready for advanced topics.";
      nextStepLabel = "Proceed to Next Concept";
    } else {
      adaptiveAction = "reinforce";
      reason = "You arrived at the correct answer, but lower confidence suggests reinforcing the underlying invariant before moving forward.";
      nextStepLabel = "Review Key Invariant & Continue";
    }
  } else {
    clarityShift = -10;
    const whyWrong = question.whyWrongMap?.[selectedIndex] || "This choice misapplies the boundary conditions of the concept.";
    didacticFeedback = `Not quite. ${whyWrong}

Key Rule: ${question.explanation}`;
    if (confidence === "high") {
      adaptiveAction = "investigate_misconception";
      reason = "You answered incorrectly with high confidence, indicating an active misconception. Reviewing the distinction will quickly clear up this confusion.";
      nextStepLabel = "Review Common Misconception";
    } else {
      adaptiveAction = "simplify_and_reteach";
      reason = "You were uncertain and selected an incorrect option. Reviewing the core intuition will make the mechanism intuitive.";
      nextStepLabel = "Revisit Intuitive Overview";
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

// src/server/sourceEngine.ts
function safeJsonParse(str) {
  if (!str) return null;
  try {
    const cleaned = str.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
function normalizeSyllabusFormatting(text) {
  if (!text) return "";
  return text.replace(/([^\r\n])\s*((?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*[0-9A-Za-zIVXLCDM]+)/gi, "$1\n$2").trim();
}
function formatTopicTitle(raw) {
  const cleaned = raw.replace(/^(?:[\*\-\•\>]|\d+[\.\)])\s*/, "").replace(/[;,]+$/, "").trim();
  if (!cleaned) return "";
  const hasLower = /[a-z]/.test(cleaned);
  const hasUpper = /[A-Z]/.test(cleaned);
  if (hasLower && hasUpper) {
    return cleaned;
  }
  if (!hasLower && hasUpper && cleaned.length <= 5) {
    return cleaned;
  }
  const smallWords = /* @__PURE__ */ new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "of", "in", "with"]);
  return cleaned.split(/\s+/).map((word, idx) => {
    if (word.length <= 5 && word === word.toUpperCase() && /[A-Z]/.test(word)) {
      return word;
    }
    const lower = word.toLowerCase();
    if (idx > 0 && smallWords.has(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(" ");
}
function splitByCommaOrSemicolon(text) {
  const parts = [];
  let current = "";
  let parenDepth = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "(" || char === "[" || char === "{") {
      parenDepth++;
      current += char;
    } else if (char === ")" || char === "]" || char === "}") {
      if (parenDepth > 0) parenDepth--;
      current += char;
    } else if ((char === "," || char === ";") && parenDepth === 0) {
      if (current.trim().length >= 2) {
        parts.push(current.trim());
      }
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim().length >= 2) {
    parts.push(current.trim());
  }
  return parts;
}
function parseCandidateTopicStrings(rawText) {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => {
    const lower = l.toLowerCase();
    return l.length > 0 && !lower.startsWith("textbook") && !lower.startsWith("reference") && !lower.startsWith("prescribed book") && !lower.startsWith("prerequisite");
  });
  const topics = [];
  for (const line of lines) {
    const cleaned = line.replace(/^(?:[\*\-\•\>]|\d+[\.\)])\s*/, "").trim();
    if (!cleaned) continue;
    const parts = splitByCommaOrSemicolon(cleaned);
    for (const part of parts) {
      if (part.length >= 2) {
        topics.push(part);
      }
    }
  }
  return topics;
}
function convertCandidateToExtractedTopic(rawCandidate, unitRef, _orderIdx) {
  const trimmed = rawCandidate.trim();
  const parenMatch = trimmed.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch && parenMatch[1].trim().length >= 2) {
    const mainTitle = formatTopicTitle(parenMatch[1]);
    const subRaw = parenMatch[2].split(/[,;]/).map((s) => s.trim()).filter((s) => s.length >= 2);
    const subtopics = subRaw.map((st, sIdx) => ({
      title: formatTopicTitle(st),
      source_reference: `${unitRef} \u2192 ${mainTitle} \u2192 ${formatTopicTitle(st)}`,
      source_excerpt: st,
      concepts: extractConceptsFromTitle(st),
      prerequisites: sIdx > 0 ? [formatTopicTitle(subRaw[sIdx - 1])] : [],
      derived: false,
      derived_from: []
    }));
    return {
      title: mainTitle,
      source_reference: `${unitRef} \u2192 ${mainTitle}`,
      source_excerpt: trimmed,
      subtopics
    };
  }
  const cleanTitle = formatTopicTitle(trimmed);
  return {
    title: cleanTitle,
    source_reference: `${unitRef} \u2192 ${cleanTitle}`,
    source_excerpt: trimmed,
    subtopics: []
  };
}
function deterministicSourceExtractor(courseName, syllabusText, materialsSummary) {
  const cleanName = (courseName || "Course").trim();
  const rawText = normalizeSyllabusFormatting((syllabusText || materialsSummary || "").trim());
  if (!rawText || rawText.length < 10) {
    return createStarterCurriculum(cleanName);
  }
  const unitLineRegex = /(?:^|\n)[ \t]*(?:UNIT|MODULE|CHAPTER|PART|SECTION)\s*[-:]?\s*([0-9A-Za-zIVXLCDM]+)(?:[ \t]*[:\-\.][ \t]*([^\r\n]*)|[ \t]*([^\r\n]*))/gi;
  const unitMatches = Array.from(rawText.matchAll(unitLineRegex));
  if (unitMatches.length >= 1) {
    const units = [];
    for (let i = 0; i < unitMatches.length; i++) {
      const match = unitMatches[i];
      const unitNum = match[1].trim();
      const headerText = (match[2] || match[3] || "").trim();
      const startIndex = match.index + match[0].length;
      const endIndex = i + 1 < unitMatches.length ? unitMatches[i + 1].index : rawText.length;
      const sectionBody = rawText.slice(startIndex, endIndex).trim();
      let unitTitle = `Unit ${unitNum}`;
      const headerCandidates = [];
      if (headerText) {
        if (headerText.includes(",") || headerText.includes(";")) {
          const dashIdx = headerText.search(/[:\-]/);
          if (dashIdx > 0 && dashIdx < 40) {
            const prefix = headerText.slice(0, dashIdx).trim();
            const rest = headerText.slice(dashIdx + 1).trim();
            if (prefix.length >= 2) {
              unitTitle = `Unit ${unitNum}: ${formatTopicTitle(prefix)}`;
            }
            headerCandidates.push(...parseCandidateTopicStrings(rest));
          } else {
            headerCandidates.push(...parseCandidateTopicStrings(headerText));
          }
        } else {
          unitTitle = `Unit ${unitNum}: ${formatTopicTitle(headerText)}`;
        }
      }
      const bodyCandidates = parseCandidateTopicStrings(sectionBody);
      const allCandidates = [...headerCandidates, ...bodyCandidates];
      const topics = [];
      if (allCandidates.length === 0) {
        topics.push({
          title: formatTopicTitle(headerText || `Unit ${unitNum} Core`),
          source_reference: `Unit ${unitNum}`,
          source_excerpt: sectionBody.slice(0, 200) || unitTitle,
          subtopics: []
        });
      } else {
        allCandidates.forEach((cand, idx) => {
          topics.push(convertCandidateToExtractedTopic(cand, `Unit ${unitNum}`, idx));
        });
      }
      units.push({
        title: unitTitle,
        source_reference: `Unit ${unitNum}`,
        topics
      });
    }
    return {
      source_summary: `Faithfully extracted ${units.length} unit(s) and ${units.reduce((acc, u) => acc + u.topics.length, 0)} topic(s) directly from student syllabus.`,
      is_generic_starter: false,
      units
    };
  }
  return parseUnstructuredSource(cleanName, rawText);
}
function parseUnstructuredSource(courseName, text) {
  const candidateTopics = parseCandidateTopicStrings(text);
  const topics = [];
  if (candidateTopics.length === 0) {
    topics.push({
      title: formatTopicTitle(courseName),
      source_reference: "Curriculum",
      source_excerpt: text.slice(0, 200),
      subtopics: []
    });
  } else {
    candidateTopics.forEach((cand, idx) => {
      topics.push(convertCandidateToExtractedTopic(cand, "Curriculum", idx));
    });
  }
  return {
    source_summary: `Structured ${topics.length} topics directly from student syllabus for ${courseName}.`,
    is_generic_starter: false,
    units: [
      {
        title: courseName,
        source_reference: "Curriculum",
        topics
      }
    ]
  };
}
function createStarterCurriculum(courseName) {
  const cLower = courseName.toLowerCase();
  const starterNote = `No custom syllabus was provided. Created a general starter curriculum for "${courseName}". You can edit the syllabus at any time to ground it in your exact course material.`;
  if (cLower.includes("operat") || cLower.includes("os")) {
    return {
      source_summary: starterNote,
      is_generic_starter: true,
      units: [
        {
          title: "Unit 1: Process Management & CPU Scheduling",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Process Management",
              source_reference: "Starter 1.1",
              source_excerpt: "Process models, states, PCB, context switching",
              subtopics: [
                {
                  title: "Process Concept, States & PCB",
                  source_reference: "Starter 1.1.1",
                  source_excerpt: "Process states, PCB tracking, context switch overhead",
                  concepts: ["Process Control Block", "Process States", "Context Switching"],
                  prerequisites: [],
                  derived: true,
                  derived_from: ["Operating Systems Fundamentals"]
                },
                {
                  title: "CPU Scheduling Algorithms (FCFS, SJF, Round Robin)",
                  source_reference: "Starter 1.1.2",
                  source_excerpt: "CPU scheduling criteria, preemptive vs non-preemptive",
                  concepts: ["Round Robin", "Time Quantum", "Convoy Effect", "Shortest Job First"],
                  prerequisites: ["Process Concept, States & PCB"],
                  derived: true,
                  derived_from: ["Process Management"]
                }
              ]
            }
          ]
        },
        {
          title: "Unit 2: Memory Management",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Virtual Memory & Paging",
              source_reference: "Starter 2.1",
              source_excerpt: "Address spaces, page tables, TLB, page replacement",
              subtopics: [
                {
                  title: "Paging & Address Translation",
                  source_reference: "Starter 2.1.1",
                  source_excerpt: "Logical vs physical address, frame allocation",
                  concepts: ["Logical Address", "Physical Frame", "Page Offset"],
                  prerequisites: [],
                  derived: true,
                  derived_from: ["Memory Architecture"]
                },
                {
                  title: "Page Tables & TLB Mechanics",
                  source_reference: "Starter 2.1.2",
                  source_excerpt: "Multi-level page tables, TLB hit ratio and miss penalty",
                  concepts: ["Page Tables", "TLB", "Translation Lookaside Buffer", "Address Translation"],
                  prerequisites: ["Paging & Address Translation"],
                  derived: true,
                  derived_from: ["Virtual Memory"]
                }
              ]
            }
          ]
        }
      ]
    };
  }
  if (cLower.includes("calculus") || cLower.includes("math")) {
    return {
      source_summary: starterNote,
      is_generic_starter: true,
      units: [
        {
          title: "Unit 1: Limits & Continuity",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Foundations of Limits",
              source_reference: "Starter 1.1",
              source_excerpt: "Definition of limits, one-sided limits, continuity",
              subtopics: [
                {
                  title: "Limit Concept & Evaluation",
                  source_reference: "Starter 1.1.1",
                  source_excerpt: "Evaluating limits algebraically and graphically",
                  concepts: ["Limit Laws", "Indeterminate Forms", "Approaching Values"],
                  prerequisites: [],
                  derived: true,
                  derived_from: ["Precalculus Algebra"]
                },
                {
                  title: "Continuity & Intermediate Value Theorem",
                  source_reference: "Starter 1.1.2",
                  source_excerpt: "Points of discontinuity and IVT application",
                  concepts: ["Continuous Functions", "Removable Discontinuity", "IVT"],
                  prerequisites: ["Limit Concept & Evaluation"],
                  derived: true,
                  derived_from: ["Limits"]
                }
              ]
            }
          ]
        },
        {
          title: "Unit 2: Derivatives & Differentiation Rules",
          source_reference: "General Starter Curriculum",
          topics: [
            {
              title: "Differential Calculus",
              source_reference: "Starter 2.1",
              source_excerpt: "Power rule, product rule, quotient rule, chain rule",
              subtopics: [
                {
                  title: "Fundamental Derivative Rules",
                  source_reference: "Starter 2.1.1",
                  source_excerpt: "Power, product, and quotient rules",
                  concepts: ["Instantaneous Rate of Change", "Tangent Slope", "Power Rule"],
                  prerequisites: ["Continuity & Intermediate Value Theorem"],
                  derived: true,
                  derived_from: ["Differential Calculus"]
                },
                {
                  title: "Chain Rule for Composite Functions",
                  source_reference: "Starter 2.1.2",
                  source_excerpt: "Differentiating outer and inner functions",
                  concepts: ["Composite Functions", "Chain Rule", "Inner Derivative"],
                  prerequisites: ["Fundamental Derivative Rules"],
                  derived: true,
                  derived_from: ["Derivatives"]
                }
              ]
            }
          ]
        }
      ]
    };
  }
  return {
    source_summary: starterNote,
    is_generic_starter: true,
    units: [
      {
        title: `Unit 1: Core Foundations of ${courseName}`,
        source_reference: "General Starter Curriculum",
        topics: [
          {
            title: `Foundations of ${courseName}`,
            source_reference: "Starter 1.1",
            source_excerpt: `Foundational principles and terminology of ${courseName}`,
            subtopics: [
              {
                title: `${courseName} Principles & Core Concepts`,
                source_reference: "Starter 1.1.1",
                source_excerpt: `Essential vocabulary, definitions, and model assumptions in ${courseName}`,
                concepts: [`${courseName} Basics`, "Definitions", "Core Models"],
                prerequisites: [],
                derived: true,
                derived_from: ["Subject Overview"]
              },
              {
                title: `Structural Models & Methodology`,
                source_reference: "Starter 1.1.2",
                source_excerpt: `Analytical methods and structural patterns in ${courseName}`,
                concepts: ["Framework Analysis", "Methodology", "Problem Solving"],
                prerequisites: [`${courseName} Principles & Core Concepts`],
                derived: true,
                derived_from: ["Foundations"]
              }
            ]
          }
        ]
      },
      {
        title: `Unit 2: Advanced Applications & Techniques`,
        source_reference: "General Starter Curriculum",
        topics: [
          {
            title: `Applied ${courseName}`,
            source_reference: "Starter 2.1",
            source_excerpt: `Case studies and complex operations in ${courseName}`,
            subtopics: [
              {
                title: `Operational Techniques & Mechanics`,
                source_reference: "Starter 2.1.1",
                source_excerpt: `Step-by-step procedures and execution rules in ${courseName}`,
                concepts: ["Procedures", "Execution Rules", "Verification"],
                prerequisites: [`Structural Models & Methodology`],
                derived: true,
                derived_from: ["Applications"]
              },
              {
                title: `Analysis, Optimization & Best Practices`,
                source_reference: "Starter 2.1.2",
                source_excerpt: `Edge cases, trade-offs, and critical evaluation in ${courseName}`,
                concepts: ["Trade-offs", "Critical Evaluation", "Optimization"],
                prerequisites: [`Operational Techniques & Mechanics`],
                derived: true,
                derived_from: ["Advanced Topics"]
              }
            ]
          }
        ]
      }
    ]
  };
}
function extractConceptsFromTitle(title) {
  const cleaned = title.replace(/^(?:Unit|Module|Chapter)\s*\d+[:\-\s]*/i, "").trim();
  const tokens = cleaned.split(/[\s,&/()]+/).map((t) => t.trim()).filter((t) => t.length > 2 && !["and", "for", "the", "with", "part", "core", "theory"].includes(t.toLowerCase()));
  const concepts = [cleaned];
  for (const token of tokens) {
    if (!concepts.includes(token)) {
      concepts.push(token);
    }
  }
  return concepts.slice(0, 5);
}
async function extractCourseSource(ai, callGeminiFn, params) {
  const { courseName, subject, academicLevel, syllabusText, materialsSummary } = params;
  if ((!syllabusText || syllabusText.trim().length < 10) && (!materialsSummary || materialsSummary.trim().length < 10)) {
    return createStarterCurriculum(courseName);
  }
  const rawInput = [
    syllabusText ? `STUDENT SYLLABUS:
${normalizeSyllabusFormatting(syllabusText)}` : "",
    materialsSummary ? `UPLOADED NOTES / STUDY MATERIALS:
${normalizeSyllabusFormatting(materialsSummary)}` : ""
  ].filter(Boolean).join("\n\n");
  if (ai) {
    const prompt = `You are the KnowIQ Source-Grounded Curriculum Architect.
Your PRIMARY AND ABSOLUTE RESPONSIBILITY is to faithfully extract and structure WHAT THE STUDENT ACTUALLY PROVIDED.

COURSE NAME: "${courseName}"
SUBJECT: "${subject || "General"}"
ACADEMIC LEVEL: "${academicLevel || "Undergraduate"}"

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
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: "application/json" });
      const parsed = safeJsonParse(raw);
      const validation = sourceExtractionSchema.safeParse(parsed);
      if (validation.success && validation.data.units.length > 0) {
        return validation.data;
      }
    } catch (err) {
      console.warn("[sourceEngine] Gemini extraction error, falling back to deterministic parser:", err);
    }
  }
  return deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
}
function flattenUnitsToCourseTopics(extraction, _courseTitle) {
  const topics = [];
  let topicOrder = 1;
  for (const unit of extraction.units) {
    const isExplicitUnit = /^(?:unit|module|chapter|part|section)\b/i.test(unit.title);
    for (const top of unit.topics) {
      const subtopics = (top.subtopics || []).map((st, sIdx) => ({
        id: `sub-${Date.now()}-${topicOrder}-${sIdx + 1}`,
        title: st.title,
        order: sIdx + 1,
        isCompleted: false,
        isLocked: topicOrder > 1 || sIdx > 0,
        clarityScore: 0,
        daysUntilRevision: 7,
        estimatedRetention: 100,
        sourceReference: st.source_reference || top.source_reference || unit.source_reference,
        sourceExcerpt: st.source_excerpt || top.source_excerpt || "",
        concepts: st.concepts || extractConceptsFromTitle(st.title),
        prerequisites: st.prerequisites || [],
        derived: st.derived || false,
        derivedFrom: st.derived_from || []
      }));
      topics.push({
        id: `top-${Date.now()}-${topicOrder}`,
        title: top.title,
        order: topicOrder,
        isCompleted: false,
        isLocked: topicOrder > 1,
        unitTitle: isExplicitUnit ? unit.title : void 0,
        sourceReference: isExplicitUnit ? top.source_reference || unit.source_reference : `Topic ${topicOrder}`,
        sourceExcerpt: top.source_excerpt || "",
        hasSubtopics: subtopics.length > 0 ? true : void 0,
        subtopics
      });
      topicOrder++;
    }
  }
  return topics;
}
async function generateSourceGroundedContent(ai, callGeminiFn, params) {
  const {
    courseName,
    topicTitle,
    subtopicTitle,
    existingClarity = 50,
    sourceReference,
    sourceExcerpt,
    concepts = [],
    prerequisites = [],
    academicLevel = "Undergraduate"
  } = params;
  if (ai) {
    const conceptsList = concepts.length > 0 ? concepts.join(", ") : subtopicTitle;
    const prompt = `You are the KnowIQ AI Teacher and Adaptive Learning Engine.
YOUR INSTRUCTION IS TO TEACH EXACTLY THIS SELECTED LEARNING UNIT:
- Subtopic: "${subtopicTitle}"
- Parent Topic / Unit: "${topicTitle}"
- Course: "${courseName}" (${academicLevel})
- Key Concepts: ${conceptsList}
- Source Reference: ${sourceReference || "From Course Syllabus"}
- Source Excerpt: "${sourceExcerpt || subtopicTitle}"
- Prerequisites: ${prerequisites.join(", ") || "None"}
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
      "url": "https://www.youtube.com/results?search_query=${encodeURIComponent(subtopicTitle + " " + courseName)}",
      "tag": "Video"
    }
  ]
}
Output strictly valid JSON.`;
    try {
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: "application/json" });
      const parsed = safeJsonParse(raw);
      const validation = geminiSubtopicContentSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }
    } catch (err) {
      console.warn("[sourceEngine] Gemini subtopic-content error, falling back to dynamic generator:", err);
    }
  }
  return await buildDynamicGroundedPacket(courseName, topicTitle, subtopicTitle, concepts, sourceExcerpt);
}
async function buildDynamicGroundedPacket(courseName, topicTitle, subtopicTitle, concepts, sourceExcerpt) {
  const clarity = await generateConceptualClarity(null, null, {
    courseName,
    topicTitle,
    subtopicTitle,
    concepts,
    sourceExcerpt,
    academicLevel: "Undergraduate"
  });
  const primaryConcept = clarity.key_concepts[0]?.term || concepts[0] || subtopicTitle;
  const primaryConceptExpl = clarity.key_concepts[0]?.explanation || clarity.summary;
  const secondaryConcept = clarity.key_concepts[1]?.term || `${subtopicTitle} Mechanism`;
  const secondaryConceptExpl = clarity.key_concepts[1]?.explanation || clarity.explanation;
  const firstExample = clarity.examples[0] || { title: "Practical Application", explanation: "Illustrates the mechanism in a real-world scenario." };
  const firstConfusion = clarity.common_confusions[0] || {
    confusion: `Confusing ${subtopicTitle} with related adjacent concepts.`,
    clarification: `Focus on the exact problem ${subtopicTitle} solves: ${clarity.summary}`
  };
  const paragraphs = clarity.explanation.split("\n\n").filter((p) => p.trim().length > 0);
  const whatIsIt = paragraphs[0] || clarity.summary;
  const whyExists = paragraphs[1] || `To solve key architectural and computational challenges in ${topicTitle}.`;
  const problemSolved = paragraphs[2] || `Provides systematic control, determinism, and execution guarantees.`;
  return {
    conceptual: {
      quick: clarity.summary,
      standard: clarity.explanation,
      deep: `${clarity.explanation}

### Core Key Concepts:
${clarity.key_concepts.map((k) => `\u2022 **${k.term}**: ${k.explanation}`).join("\n")}

### Practical Demonstrations:
${clarity.examples.map((e) => `\u2022 **${e.title}**: ${e.explanation}`).join("\n")}`,
      expert: `${clarity.explanation}

### Common Pitfalls & Confusions:
${clarity.common_confusions.map((c) => `\u2022 **Misconception**: ${c.confusion}
  **Clarification**: ${c.clarification}`).join("\n")}`,
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
      explanation: clarity.explanation
    },
    interactive: {
      fillBlank: {
        question: `Complete the foundational statement regarding ${subtopicTitle}:`,
        preText: `In the context of ${topicTitle},`,
        missingWord: primaryConcept,
        postText: `serves as the primary mechanism for systematic operation.`,
        options: [primaryConcept, "Random Access Bypass", "Arbitrary Memory Allocation", "Unchecked Execution"],
        hint: `Focus on the core concept: ${primaryConcept}`,
        explanation: `${primaryConcept} is defined as: ${primaryConceptExpl}`
      },
      matching: clarity.key_concepts.slice(0, 4).map((k, idx) => ({
        id: `m${idx + 1}`,
        term: k.term,
        definition: k.explanation
      })),
      ordering: {
        title: `${subtopicTitle} Execution Sequence`,
        instruction: `Arrange the logical stages of ${subtopicTitle} from first to last:`,
        items: [
          { id: "o1", text: `1. Input request arrives and preconditions are validated for ${primaryConcept}`, correctOrder: 1 },
          { id: "o2", text: `2. Core operational mechanism of ${subtopicTitle} processes the state transition`, correctOrder: 2 },
          { id: "o3", text: `3. Boundary invariants and safety constraints are checked`, correctOrder: 3 },
          { id: "o4", text: `4. Output or state update is committed to ${topicTitle}`, correctOrder: 4 }
        ]
      }
    },
    deepRevision: {
      detailedNotes: clarity.key_takeaways.length > 0 ? clarity.key_takeaways : [
        `Core Principle: ${clarity.summary}`,
        `Mechanism: ${whatIsIt}`,
        `Avoid Confusion: ${firstConfusion.clarification}`
      ],
      comparisonTable: {
        title: `${subtopicTitle} Comparative Breakdown`,
        headers: ["Dimension", subtopicTitle, "Common Misconception", "Key Distinction"],
        rows: [
          ["Primary Role", primaryConcept, firstConfusion.confusion, firstConfusion.clarification],
          ["Execution Mechanism", secondaryConcept, "Assumed to be unpredictable or ad-hoc", "Follows deterministic invariants"],
          ["Key Takeaway", clarity.key_takeaways[0] || subtopicTitle, "Over-simplification without edge cases", "Provides rigorous guarantees"]
        ]
      },
      commonPitfalls: clarity.common_confusions.map((c) => `${c.confusion} -> ${c.clarification}`),
      mentalModelOrMnemonic: clarity.analogy || `Memory Anchor: "${primaryConcept} drives ${subtopicTitle}."`
    },
    hardQuiz: [
      {
        id: "q1",
        question: `Which statement best describes the fundamental purpose of ${subtopicTitle}?`,
        options: [
          whatIsIt,
          `To bypass architectural checks and randomize execution order`,
          `To eliminate the need for ${topicTitle} entirely`,
          `To convert high-level instructions into unverified raw text`
        ],
        correctIndex: 0,
        category: "conceptual",
        explanation: `Correct! ${whatIsIt}`
      },
      {
        id: "q2",
        question: `In ${subtopicTitle}, what is the defining characteristic of ${primaryConcept}?`,
        options: [
          primaryConceptExpl,
          "It acts as an undocumented workaround with no defined behavior",
          "It operates without maintaining system invariants",
          "It is completely unrelated to the operation of the system"
        ],
        correctIndex: 0,
        category: "recall",
        explanation: `Exactly. ${primaryConcept} is defined as: ${primaryConceptExpl}`
      },
      {
        id: "q3",
        question: `Consider the following scenario: ${firstExample.title}. How does ${subtopicTitle} apply?`,
        options: [
          firstExample.explanation,
          "The system ignores the scenario and proceeds without state validation",
          "All prior states are immediately corrupted and discarded",
          "The operation produces undefined behavior in standard environments"
        ],
        correctIndex: 0,
        category: "application",
        explanation: `Right! As demonstrated in ${firstExample.title}: ${firstExample.explanation}`
      },
      {
        id: "q4",
        question: `How does ${subtopicTitle} resolve the common confusion: "${firstConfusion.confusion}"?`,
        options: [
          firstConfusion.clarification,
          "It treats both concepts as strictly identical with zero distinction",
          "It deletes the distinguishing parameters from the execution context",
          "It assumes the confusion has no impact on practical correctness"
        ],
        correctIndex: 0,
        category: "differentiation",
        explanation: `Correct distinction! ${firstConfusion.clarification}`
      },
      {
        id: "q5",
        question: `Why does ${subtopicTitle} matter in practical system design?`,
        options: [
          whyExists,
          "It is an obsolete academic artifact with no practical usage",
          "It guarantees infinite performance regardless of hardware limits",
          "It eliminates all need for testing or verification"
        ],
        correctIndex: 0,
        category: "application",
        explanation: `Key insight: ${whyExists}`
      }
    ],
    externalResources: [
      {
        type: "video",
        title: `Visual Guide to ${subtopicTitle}`,
        source: "Educational Resource",
        description: `Visual walkthrough of ${subtopicTitle} mechanisms and examples`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(subtopicTitle + " " + courseName)}`,
        tag: "Video"
      }
    ]
  };
}
async function diagnoseSubtopicClarity(ai, callGeminiFn, params) {
  const { subtopicTitle, topicTitle, courseName, concepts = [], questions, userAnswers } = params;
  let correctCount = 0;
  const categoryTotals = {
    conceptual: { total: 0, correct: 0 },
    recall: { total: 0, correct: 0 },
    application: { total: 0, correct: 0 },
    differentiation: { total: 0, correct: 0 }
  };
  const questionDetails = questions.map((q, i) => {
    const userSelected = userAnswers[q.id] ?? userAnswers[i];
    const isCorrect = userSelected === q.correctIndex;
    if (isCorrect) correctCount++;
    const cat = q.category || "conceptual";
    if (categoryTotals[cat]) {
      categoryTotals[cat].total += 1;
      if (isCorrect) categoryTotals[cat].correct += 1;
    }
    return {
      question: q.question,
      options: q.options,
      userAnswer: q.options?.[userSelected] || "None",
      correctAnswer: q.options?.[q.correctIndex] || "None",
      isCorrect,
      category: cat,
      explanation: q.explanation
    };
  });
  const getPct = (cat, fallback) => {
    const item = categoryTotals[cat];
    if (!item || item.total === 0) return fallback;
    return Math.round(item.correct / item.total * 100);
  };
  const conceptualScore = getPct("conceptual", correctCount >= 4 ? 90 : 65);
  const recallScore = getPct("recall", correctCount >= 4 ? 85 : 60);
  const applicationScore = getPct("application", correctCount >= 4 ? 80 : 45);
  const differentiationScore = getPct("differentiation", correctCount >= 4 ? 75 : 40);
  const overallClarity = Math.round(
    0.3 * conceptualScore + 0.2 * recallScore + 0.3 * applicationScore + 0.2 * differentiationScore
  );
  if (ai) {
    const prompt = `You are the KnowIQ Cognitive Clarity Diagnostic Engine.
Evaluate the student's performance specifically on Subtopic: "${subtopicTitle}".
Parent Topic: "${topicTitle || ""}"
Course: "${courseName || ""}"
Key Concepts: ${concepts.join(", ") || subtopicTitle}

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
   - The diagnosis must diagnose the EXACT misconception about "${subtopicTitle}" and its concepts (${concepts.join(", ")}).
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
      const raw = await callGeminiFn(ai, prompt, { responseMimeType: "application/json" });
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
          nextAction: validation.data.nextAction || "Review targeted remediation drill.",
          remediationContent: validation.data.remediationContent
        };
      }
    } catch (err) {
      console.warn("[sourceEngine] Gemini diagnose error, falling back to deterministic diagnosis:", err);
    }
  }
  const primaryConcept = concepts[0] || subtopicTitle;
  let detectedIssue = "";
  let nextAction = "";
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
          `Assuming that all inputs produce identical outputs regardless of context`
        ],
        correctIndex: 0,
        explanation: `Preserving verified preconditions and following the formal rules of ${subtopicTitle} guarantees correctness for ${primaryConcept}.`
      }
    }
  };
}

// src/server/topicEngine.ts
function safeExtractJson2(raw) {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  }
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
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
function analyzeTopic(topicTitle, context) {
  const cleanTitle = topicTitle.trim();
  const sourceText = `${context.syllabusExcerpt || ""} ${context.sourceContext || ""}`.trim();
  let sourceSubUnits = [];
  if (sourceText) {
    const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const bulletSectionRegex = new RegExp(
      `(?:^|\\n)[ \\t]*(?:Unit\\s*\\d*[:\\-\\s]*)?${escaped}[^\\n]*\\n((?:[ \\t]*[\\-\\\u2022\\*\\d+\\.]+[ \\t]+[^\\n]+\\n?)+)`,
      "i"
    );
    const bulletMatch = sourceText.match(bulletSectionRegex);
    if (bulletMatch && bulletMatch[1]) {
      const lines = bulletMatch[1].split("\n").map((l) => l.replace(/^[ \t]*[\-\•\*\d+\.]+[ \t]*/, "").trim()).filter((l) => l.length >= 2 && !l.toLowerCase().includes(cleanTitle.toLowerCase()));
      if (lines.length >= 2) {
        sourceSubUnits = lines.slice(0, 6);
      }
    }
    if (sourceSubUnits.length === 0) {
      const topicSectionRegex = new RegExp(`${escaped}\\s*(?:[:\\-\u2013\u2014]\\s*|\\()([^\\n\\r.)]+)`, "i");
      const match = sourceText.match(topicSectionRegex);
      if (match && match[1]) {
        const parts = match[1].split(/[,;&|•]|\band\b/i).map((p) => p.trim()).filter((p) => p.length >= 3 && !p.toLowerCase().includes(cleanTitle.toLowerCase()));
        if (parts.length >= 2) {
          sourceSubUnits = parts.slice(0, 6);
        }
      }
    }
  }
  const lower = cleanTitle.toLowerCase();
  const compositeIndicators = [
    "scheduling",
    "management",
    "virtual memory",
    "concurrency",
    "architecture",
    "algorithms",
    "protocols",
    "patterns",
    "lifecycle",
    "pipeline",
    "strategies",
    "principles",
    "paradigms",
    "structures",
    "subsystems",
    "models"
  ];
  const atomicIndicators = [
    "register",
    "counter",
    "flag",
    "pointer",
    "instruction",
    "primitive",
    "formula",
    "constant",
    "equation",
    "definition",
    "law",
    "syntax"
  ];
  const hasCompositeKeyword = compositeIndicators.some((kw) => lower.includes(kw));
  const hasAtomicKeyword = atomicIndicators.some((kw) => lower.includes(kw));
  let isComposite = false;
  let reason = "";
  if (sourceSubUnits.length >= 2) {
    isComposite = true;
    reason = `The provided source material explicitly subdivides "${cleanTitle}" into ${sourceSubUnits.length} distinct learning concepts.`;
  } else if (hasAtomicKeyword && !hasCompositeKeyword) {
    isComposite = false;
    reason = `"${cleanTitle}" is a focused, atomic concept that is best learned as a single cohesive unit without artificial fragmentation.`;
  } else if (hasCompositeKeyword) {
    isComposite = true;
    reason = `"${cleanTitle}" encompasses a broader system or multi-strategy concept containing distinct components and algorithms that are clearer to learn separately.`;
  } else {
    if (lower.includes(" and ") || lower.includes(" & ") || lower.includes(" vs ")) {
      isComposite = true;
      reason = `"${cleanTitle}" compares or combines multiple distinct ideas that benefit from independent focus.`;
    } else {
      isComposite = false;
      reason = `The topic is sufficiently focused to be mastered as a unified concept.`;
    }
  }
  return {
    topic: cleanTitle,
    scope: isComposite ? "composite_domain" : "focused_atomic",
    conceptualBoundaries: `Core boundaries for ${cleanTitle} within ${context.courseName || "the subject"}.`,
    candidateConcepts: sourceSubUnits.length > 0 ? sourceSubUnits : [cleanTitle],
    suggestedLearningUnits: sourceSubUnits,
    reason
  };
}
function decideSubtopics(analysis, topicTitle) {
  if (analysis.scope === "focused_atomic") {
    return {
      has_subtopics: false,
      reason_for_structure: analysis.reason,
      subtopics: []
    };
  }
  const cleanTitle = topicTitle.trim();
  let subtopicTitles = [];
  if (analysis.suggestedLearningUnits.length >= 2) {
    subtopicTitles = analysis.suggestedLearningUnits;
  } else {
    const lower = cleanTitle.toLowerCase();
    if (lower.includes("scheduling")) {
      subtopicTitles = [
        "Scheduling Basics & Core Goals",
        "Scheduling Criteria & Metrics",
        "First-Come First-Served (FCFS) & Shortest Job First (SJF)",
        "Round Robin & Priority Scheduling",
        "Multilevel Queue & Real-Time Considerations"
      ];
    } else if (lower.includes("virtual memory")) {
      subtopicTitles = [
        "Virtual vs Physical Memory",
        "Paging and Page Tables",
        "Page Faults & Demand Paging",
        "Page Replacement Algorithms",
        "Thrashing & Working Set Model"
      ];
    } else if (lower.includes("memory")) {
      subtopicTitles = [
        "Memory Hierarchy & Addressing Basics",
        "Contiguous Allocation vs Paging",
        "Page Tables & Address Translation",
        "Virtual Memory & Page Replacement Policies"
      ];
    } else if (lower.includes("concurrency") || lower.includes("thread") || lower.includes("process")) {
      subtopicTitles = [
        "Foundational Mechanics & State Model",
        "Critical Section Problem & Race Conditions",
        "Synchronization Primitives (Mutexes & Semaphores)",
        "Deadlock Conditions & Prevention Strategies"
      ];
    } else {
      subtopicTitles = [
        `${cleanTitle}: Core Principles & Architecture`,
        `${cleanTitle}: Primary Mechanisms & Operation`,
        `${cleanTitle}: Practical Trade-offs & Implementation`
      ];
    }
  }
  const clamped = subtopicTitles.slice(0, 6);
  const subtopics = clamped.map((title, idx) => ({
    title,
    description: `Understanding ${title.toLowerCase()} in relation to ${cleanTitle}.`,
    order: idx + 1
  }));
  return {
    has_subtopics: true,
    reason_for_structure: analysis.reason,
    subtopics
  };
}
function generateConceptualClarity2(topicTitle, decision, context) {
  const cleanTitle = topicTitle.trim();
  const course = context.courseName || "Computer Science";
  const summary = `A focused examination of ${cleanTitle}, articulating its core purpose, operating mechanics, practical applications, and distinct role within ${course}.`;
  const paragraph1 = `${cleanTitle} is a foundational concept in ${course}. At its core, it addresses the need to manage system resources predictably and efficiently without introducing unnecessary overhead. Rather than viewing it in isolation, it must be understood as an intentional design choice created to solve specific bottlenecks in computational systems.`;
  const paragraph2 = `The primary motivation behind ${cleanTitle} centers on predictability, throughput, and safety. When computer systems scale, resource contention and execution delays quickly degrade performance unless well-defined coordination mechanisms are in place. ${cleanTitle} formalizes these boundaries, providing deterministic rules for how operations are initiated, validated, and completed.`;
  const paragraph3 = `In execution, ${cleanTitle} operates by maintaining explicit state metadata and applying systematic policies. For instance, when state transitions occur, hardware or software layers consult these policies to make immediate allocation or arbitration decisions. This ensures that concurrent tasks do not step on each other, while maintaining high utilization of available processing power.`;
  const paragraph4 = `In practical engineering, ${cleanTitle} is routinely applied in high-performance environments, real-time operating systems, and distributed platforms. Understanding its performance characteristics\u2014such as latency trade-offs, cache impact, and algorithmic complexity\u2014allows developers to diagnose performance regressions and select the most appropriate design patterns for production workloads.`;
  const explanation = `${paragraph1}

${paragraph2}

${paragraph3}

${paragraph4}`;
  const examples = [
    {
      title: "High-Concurrency Workload Arbitration",
      explanation: `In high-concurrency systems, ${cleanTitle} governs active workload transitions, ensuring rapid response times while preventing resource starvation under peak loads.`
    },
    {
      title: "Performance Diagnostics and Bottleneck Isolation",
      explanation: `During system diagnostics or performance tuning, analyzing ${cleanTitle} metrics reveals whether stalls stem from waiting queues or misconfigured allocation thresholds.`
    }
  ];
  const analogy = `Think of ${cleanTitle} like an air traffic control system at a busy airport: rather than allowing planes to land and take off haphazardly, it enforces strict runway sequencing, prioritization, and separation to maximize throughput and guarantee safety.`;
  const commonConfusions = [
    {
      confusion: `Assuming ${cleanTitle} is merely a theoretical convention without real runtime performance impact.`,
      clarification: `In production environments, misconfiguring ${cleanTitle} introduces tangible scheduling latency, contention, and resource starvation.`
    },
    {
      confusion: `Confusing the high-level policy of ${cleanTitle} with its specific low-level hardware or kernel implementation.`,
      clarification: `The policy defines what invariant guarantees are preserved; implementations vary based on hardware architectures and execution constraints.`
    }
  ];
  const keyConcepts = [
    {
      term: "Operational Invariant",
      explanation: `The critical condition that ${cleanTitle} preserves across all operational state transitions.`
    },
    {
      term: "State Metadata",
      explanation: `Contextual tracking information maintained to ensure deterministic execution.`
    }
  ];
  const keyTakeaways = [
    `${cleanTitle} establishes deterministic coordination rules to prevent resource contention.`,
    `Always verify boundary invariants before committing state transitions.`,
    `Consider throughput vs. latency trade-offs when tuning performance parameters.`
  ];
  return {
    summary,
    explanation,
    key_concepts: keyConcepts,
    examples,
    analogy,
    common_confusions: commonConfusions,
    key_takeaways: keyTakeaways
  };
}
function runDeterministicTopicAnalysis(params) {
  const analysis = analyzeTopic(params.topicTitle, {
    courseName: params.courseName,
    subject: params.subject,
    academicLevel: params.academicLevel,
    syllabusExcerpt: params.syllabusExcerpt,
    sourceContext: params.sourceContext
  });
  const decision = decideSubtopics(analysis, params.topicTitle);
  const conceptualClarity = generateConceptualClarity2(params.topicTitle, decision, {
    courseName: params.courseName,
    academicLevel: params.academicLevel,
    syllabusExcerpt: params.syllabusExcerpt
  });
  return {
    topic: params.topicTitle.trim(),
    has_subtopics: decision.has_subtopics,
    reason_for_structure: decision.reason_for_structure,
    subtopics: decision.subtopics,
    conceptual_clarity: conceptualClarity
  };
}
async function runTopicAnalysisPipeline(ai, caller, params) {
  const cleanTopic = params.topicTitle.trim();
  const cleanCourse = params.courseName?.trim() || "Course";
  const cleanSubject = params.subject?.trim() || "General";
  const academicLevel = params.academicLevel?.trim() || "Undergraduate";
  const sourceContext = `${params.syllabusExcerpt || ""} ${params.sourceContext || ""}`.trim();
  if (!ai) {
    return runDeterministicTopicAnalysis(params);
  }
  const prompt = `You are Knowiq's AI Learning Engine.

Your job is to analyze a student-provided topic and decide how it should be taught.

IMPORTANT:
The student's topic is the source of truth. Do not replace the topic with a generic curriculum.

### Context
Course: "${cleanCourse}" (${cleanSubject})
Academic Level: "${academicLevel}"
Topic: "${cleanTopic}"
Source Context / Syllabus Material:
"""
${sourceContext || "No additional syllabus excerpt provided. Use academic standards for " + cleanSubject + "."}
"""

### 1. Analyze the Topic
First understand:
* What the topic means
* Its scope
* Its conceptual boundaries
* The major concepts that must be understood
* Whether it naturally contains smaller independent learning units

### 2. Decide Whether Subtopics Are Needed
Do NOT create subtopics automatically.
Create subtopics ONLY when the topic contains multiple meaningful concepts that:
* can be understood independently,
* are worth teaching separately,
* have a logical relationship to the parent topic,
* and would make learning clearer.

If the topic is already focused and reasonably small, return:
has_subtopics: false
and:
subtopics: []
Do not artificially split a small topic. (e.g. "CPU Registers" -> no subtopics)

If subtopics are appropriate: (e.g. "Process Scheduling" -> multiple algorithms/metrics)
* Create approximately 2\u20136 subtopics.
* Keep each subtopic focused.
* Order them from foundational \u2192 advanced where appropriate.
* Avoid overlapping or duplicate subtopics.
* Do not create tiny subtopics that contain only one definition.

### 3. Conceptual Clarity
Generate MEDIUM LENGTH conceptual clarity content for the topic.
Target:
* approximately 3\u20136 short paragraphs
* 1\u20132 useful examples where appropriate
* an analogy when it genuinely improves understanding (or null if none fits naturally)
* important terminology explained in context
* common confusion or misconception when relevant

Do NOT:
* produce extremely long explanations
* repeat the same idea
* add unnecessary historical/background filler
* pad response to reach a word count
* turn topic into a textbook chapter

### 4. Teach for Understanding
The explanation should help the student answer:
1. What is this?
2. Why does it exist?
3. How does it work?
4. When is it used?
5. How is it different from related concepts?
6. Can I recognize or apply it in a new situation?

### 5. Output Structure (Strict JSON only)
{
  "topic": "${cleanTopic}",
  "has_subtopics": true,
  "reason_for_structure": "The topic contains several distinct scheduling concepts and algorithms that are easier to learn separately.",
  "subtopics": [
    {
      "title": "Scheduling Basics",
      "description": "The fundamental idea of CPU scheduling and why it is needed.",
      "order": 1
    }
  ],
  "conceptual_clarity": {
    "summary": "A concise overview of the topic.",
    "explanation": "3 to 6 medium-length paragraphs focused on genuine understanding.",
    "key_concepts": [
      {
        "term": "Core Term",
        "explanation": "Clear explanation in context."
      }
    ],
    "examples": [
      {
        "title": "Concrete Worked Example",
        "explanation": "Walkthrough with real inputs and outcomes."
      }
    ],
    "analogy": "A clear, helpful analogy or null",
    "common_confusions": [
      {
        "confusion": "Common misconception or trap",
        "clarification": "Clear explanation of the distinction"
      }
    ],
    "key_takeaways": [
      "Core takeaway 1",
      "Core takeaway 2"
    ]
  }
}

CRITICAL RULES:
- If has_subtopics is false, subtopics MUST be [].
- Output MUST be valid JSON only. No prose before or after.`;
  try {
    const rawResult = await caller(ai, prompt, { responseMimeType: "application/json" });
    const parsed = safeExtractJson2(rawResult);
    if (parsed) {
      const validation = topicAnalysisResultSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      } else {
        console.warn("[topicEngine] AI output schema mismatch:", validation.error.format());
        if (parsed.has_subtopics === false && Array.isArray(parsed.subtopics) && parsed.subtopics.length > 0) {
          parsed.subtopics = [];
        }
        const secondCheck = topicAnalysisResultSchema.safeParse(parsed);
        if (secondCheck.success) {
          return secondCheck.data;
        }
      }
    }
  } catch (err) {
    console.error("[topicEngine] Gemini analysis error, invoking fallback:", err);
  }
  return runDeterministicTopicAnalysis(params);
}

// src/server/gemini.ts
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var geminiClient = null;
function getGeminiClient() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return geminiClient;
}
var aiResponseCache = /* @__PURE__ */ new Map();
var quotaCooldownUntil = 0;
var demandCooldownUntil = 0;
async function callGeminiWithRetry(ai, prompt, options) {
  if (!ai) return null;
  const cacheKey = `${options?.responseMimeType || "text"}:${prompt.slice(0, 200)}:${prompt.length}`;
  if (aiResponseCache.has(cacheKey)) {
    return aiResponseCache.get(cacheKey);
  }
  const now = Date.now();
  if (now < quotaCooldownUntil || now < demandCooldownUntil) {
    return null;
  }
  try {
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(() => reject(new Error("Model call timeout")), 25e3)
    );
    const callPromise = ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: options?.responseMimeType ? { responseMimeType: options.responseMimeType } : void 0
    });
    const response = await Promise.race([callPromise, timeoutPromise]);
    if (response && response.text) {
      aiResponseCache.set(cacheKey, response.text);
      return response.text;
    }
  } catch (err) {
    const msg = String(err?.message || err);
    console.warn("[callGeminiWithRetry] Gemini error:", msg);
    const isQuotaExhausted = msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED");
    const isHighDemand = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand");
    if (isQuotaExhausted) {
      quotaCooldownUntil = Date.now() + 6e4;
    } else if (isHighDemand) {
      demandCooldownUntil = Date.now() + 15e3;
    }
  }
  return null;
}

// src/server/app.ts
dotenv2.config();
var app = express();
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const url = req.originalUrl || req.url;
    if (url.startsWith("/api") || url.startsWith("/health")) {
      console.log(`[API ${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${url} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});
var apiRouter = express.Router();
apiRouter.get("/health", (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: "knowiq-api"
  });
});
apiRouter.post("/ai/extract-preview", async (req, res) => {
  const { courseName, subject, academicLevel } = req.body;
  const syllabusText = req.body.syllabusText || req.body.syllabus;
  const materialsSummary = req.body.materialsSummary || req.body.materials;
  try {
    const ai = getGeminiClient();
    const extraction = await extractCourseSource(ai, callGeminiWithRetry, {
      courseName,
      subject,
      academicLevel,
      syllabusText,
      materialsSummary
    });
    return res.status(200).json(extraction);
  } catch (err) {
    console.warn("[extract-preview] Falling back to deterministic extractor:", err);
    const fallback = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    return res.status(200).json(fallback);
  }
});
apiRouter.post("/ai/syllabus", async (req, res) => {
  const { courseName, subject, academicLevel } = req.body;
  const syllabusText = req.body.syllabusText || req.body.syllabus;
  const materialsSummary = req.body.materialsSummary || req.body.materials;
  try {
    const ai = getGeminiClient();
    const extraction = await extractCourseSource(ai, callGeminiWithRetry, {
      courseName,
      subject,
      academicLevel,
      syllabusText,
      materialsSummary
    });
    const topics = flattenUnitsToCourseTopics(extraction, courseName);
    return res.status(200).json({ topics, extraction });
  } catch (err) {
    console.warn("[Syllabus] Error during extraction, using deterministic fallback:", err);
    const fallbackExtraction = deterministicSourceExtractor(courseName, syllabusText, materialsSummary);
    const topics = flattenUnitsToCourseTopics(fallbackExtraction, courseName);
    return res.status(200).json({ topics, extraction: fallbackExtraction });
  }
});
apiRouter.post("/ai/analyze-topic", async (req, res) => {
  const requestValidation = topicAnalysisRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: "Invalid topic analysis request parameters",
      details: requestValidation.error.issues[0]?.message
    });
  }
  try {
    const ai = getGeminiClient();
    const result = await runTopicAnalysisPipeline(ai, callGeminiWithRetry, requestValidation.data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[analyze-topic] Pipeline failed:", err);
    return res.status(500).json({ error: "Failed to analyze topic" });
  }
});
apiRouter.post("/ai/conceptual-clarity", async (req, res) => {
  const requestValidation = conceptualClarityRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: "Invalid conceptual clarity request parameters",
      details: requestValidation.error.issues[0]?.message
    });
  }
  try {
    const ai = getGeminiClient();
    const result = await generateConceptualClarity(ai, callGeminiWithRetry, requestValidation.data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[conceptual-clarity] Generation failed, using fallback:", err);
    const fallback = await generateConceptualClarity(null, null, requestValidation.data);
    return res.status(200).json(fallback);
  }
});
apiRouter.post("/ai/interactive-question", async (req, res) => {
  const requestValidation = generateQuestionRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: "Invalid interactive question request parameters",
      details: requestValidation.error.issues[0]?.message
    });
  }
  try {
    const ai = getGeminiClient();
    const clarity = requestValidation.data.clarity || await generateConceptualClarity(ai, callGeminiWithRetry, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      academicLevel: requestValidation.data.academicLevel
    });
    const result = await generateInteractiveQuestion(ai, callGeminiWithRetry, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      clarity
    });
    return res.status(200).json(result);
  } catch (err) {
    console.error("[interactive-question] Generation failed, using fallback:", err);
    const fallbackClarity = await generateConceptualClarity(null, null, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      academicLevel: requestValidation.data.academicLevel
    });
    const fallback = await generateInteractiveQuestion(null, null, {
      courseName: requestValidation.data.courseName,
      topicTitle: requestValidation.data.topicTitle,
      subtopicTitle: requestValidation.data.subtopicTitle,
      clarity: fallbackClarity
    });
    return res.status(200).json(fallback);
  }
});
apiRouter.post("/ai/evaluate-answer", (req, res) => {
  const requestValidation = answerEvaluationRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: "Invalid answer evaluation request parameters",
      details: requestValidation.error.issues[0]?.message
    });
  }
  try {
    const result = evaluateAnswer(requestValidation.data);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[evaluate-answer] Evaluation failed:", err);
    return res.status(500).json({ error: "Failed to evaluate answer" });
  }
});
apiRouter.post("/ai/subtopic-content", async (req, res) => {
  const requestValidation = subtopicContentRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: "Invalid request parameters",
      details: requestValidation.error.issues[0]?.message
    });
  }
  try {
    const ai = getGeminiClient();
    const content = await generateSourceGroundedContent(ai, callGeminiWithRetry, requestValidation.data);
    return res.status(200).json(content);
  } catch (err) {
    console.error("[subtopic-content] Generation failed, using dynamic packet:", err);
    const fallback = generateDynamicSubtopicContent(
      requestValidation.data.courseName,
      requestValidation.data.topicTitle,
      requestValidation.data.subtopicTitle,
      requestValidation.data.existingClarity
    );
    return res.status(200).json(fallback);
  }
});
apiRouter.post("/ai/diagnose-clarity", async (req, res) => {
  const requestValidation = diagnoseClarityRequestSchema.safeParse(req.body);
  if (!requestValidation.success) {
    return res.status(400).json({
      error: "Invalid quiz response parameters",
      details: requestValidation.error.issues[0]?.message
    });
  }
  try {
    const ai = getGeminiClient();
    const diagnostic = await diagnoseSubtopicClarity(ai, callGeminiWithRetry, requestValidation.data);
    return res.status(200).json(diagnostic);
  } catch (err) {
    console.error("[diagnose-clarity] Diagnosis failed, using dynamic diagnostic:", err);
    const diagnostic = await diagnoseSubtopicClarity(null, callGeminiWithRetry, requestValidation.data);
    return res.status(200).json(diagnostic);
  }
});
apiRouter.post("/ai/generate-revision", async (req, res) => {
  const reqVal = generateRevisionRequestSchema.safeParse(req.body);
  const { topicTitles, revisionType, difficulty, questionCount } = reqVal.success ? reqVal.data : { topicTitles: ["Database Systems"], revisionType: "Mixed", difficulty: "Medium", questionCount: 5 };
  try {
    const ai = getGeminiClient();
    if (ai) {
      const prompt = `You are an adaptive exam generator.
Selected Topics: ${JSON.stringify(topicTitles)}
Revision Type: ${revisionType} (e.g. Objective, Descriptive, Coding, Mixed)
Difficulty Level: ${difficulty} (Easy, Medium, Hard)
Question Count: ${questionCount}

Generate a high-yield adaptive revision test.
For each question provide:
- "id": string
- "question": string
- "options": array of 4 string choices (if objective/mixed), or null if purely descriptive
- "correctIndex": number (0-3)
- "explanation": string detailed explanation or rubric solution

Output strictly JSON:
{
  "title": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number,
      "explanation": "string"
    }
  ]
}`;
      const raw = await callGeminiWithRetry(ai, prompt, { responseMimeType: "application/json" });
      if (raw) {
        let text = raw.trim();
        if (text.startsWith("```json")) {
          text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (text.startsWith("```")) {
          text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        try {
          const parsed = JSON.parse(text);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return res.status(200).json(parsed);
          }
        } catch {
        }
      }
    }
    return res.status(200).json({
      title: `Curated Revision: ${topicTitles.slice(0, 2).join(" & ")}`,
      questions: [
        {
          id: "rev-1",
          question: `In relational database design, what is the primary objective of BCNF (Boyce-Codd Normal Form) over 3NF?`,
          options: [
            "Eliminate all functional dependencies where the determinant is not a superkey",
            "Allow transitive dependencies for faster index lookups",
            "Permit multivalued dependencies without creating bridge tables",
            "Force all non-key attributes to depend partially on composite keys"
          ],
          correctIndex: 0,
          explanation: "BCNF strictly requires every non-trivial functional dependency X -> Y to have X as a superkey, eliminating residual anomalies that can persist in 3NF."
        },
        {
          id: "rev-2",
          question: `Which scenario represents an unrecoverable schedule in transaction processing?`,
          options: [
            "A transaction commits after reading dirty data from a transaction that later aborts",
            "Two transactions acquire shared locks on the same data item simultaneously",
            "A transaction rolls back before writing dirty pages to the write-ahead log",
            "A transaction waits in the lock manager queue due to strict two-phase locking"
          ],
          correctIndex: 0,
          explanation: "Reading dirty data from an uncommitted transaction and committing before it aborts violates recoverability since the commit cannot be rolled back."
        },
        {
          id: "rev-3",
          question: `Why do B+ Tree indices store all record pointers in leaf nodes rather than internal nodes?`,
          options: [
            "Leaf nodes can be linked sequentially for fast range scans and higher branching factors",
            "Internal nodes cannot store numerical key comparisons",
            "It minimizes RAM consumption by eliminating tree rebalancing entirely",
            "It prevents hash collisions during point queries"
          ],
          correctIndex: 0,
          explanation: "Keeping data pointers only in leaf nodes allows internal nodes to store more index keys, maximizing fan-out, and enables linked leaf pointers for O(log N) range queries."
        }
      ]
    });
  } catch (err) {
    console.error("[generate-revision] Revision generation failed:", err);
    return res.status(500).json({ error: "Failed to generate revision test" });
  }
});
app.use("/api", apiRouter);
app.use("/", apiRouter);
app.use("/api/*", (req, res) => {
  return res.status(404).json({
    error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});

// src/api-handlers/index.ts
var index_default = app;
export {
  index_default as default
};
